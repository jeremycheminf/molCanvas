import { defineConfig, type Plugin } from 'vite';

const PORT = 1420;

// Dev-server only (apply: 'serve'): lets the in-app "Stop server" button shut the local server down.
// POST only, and only from a page served by this same local server (Host + Origin check), so other
// websites cannot trigger it.
const stopServerButton = (): Plugin => ({
  name: 'molcanvas-stop-server',
  apply: 'serve',
  configureServer(server) {
    const allowed = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
    server.middlewares.use('/__shutdown', (req, res) => {
      const origin = req.headers.origin ? new URL(req.headers.origin).host : '';
      if (req.method !== 'POST' || !allowed.has(req.headers.host ?? '') || !allowed.has(origin)) {
        res.statusCode = 403;
        res.end('forbidden');
        return;
      }
      res.statusCode = 200;
      res.end('stopping');
      setTimeout(() => { server.close().finally(() => process.exit(0)); }, 100);
    });
  },
});

// base './' keeps asset paths relative so the same build works on GitHub Pages and inside Tauri.
export default defineConfig({
  base: './',
  clearScreen: false,
  server: { port: PORT, strictPort: true },
  plugins: [stopServerButton()],
  build: { target: 'safari15', chunkSizeWarningLimit: 4000 },
});
