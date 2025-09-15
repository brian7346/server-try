import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function computeOpenPath() {
  // Активируется только для скрипта npm run play
  if (process.env.npm_lifecycle_event !== 'play') return false;
  try {
    const raw = JSON.parse(process.env.npm_config_argv || '{}');
    const args = raw?.original ?? raw?.remain ?? [];
    const candidate = [...args]
      .reverse()
      .find((a) => typeof a === 'string' && !a.startsWith('-') && a !== 'run' && a !== 'play' && a !== 'vite');
    if (!candidate) return '/';
    const webPath = ('/' + String(candidate).replace(/\\/g, '/').replace(/^\/+/, ''));
    if (webPath.endsWith('.html')) return webPath;
    return `/play.html?file=${encodeURIComponent(webPath)}`;
  } catch {
    return false;
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: computeOpenPath(),
  },
  appType: 'spa',
});


