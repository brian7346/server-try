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
    // Безопасно декодируем кириллические символы в пути (не падаем на уже декодированном вводе)
    const safeDecode = (s) => {
      try { return decodeURIComponent(s); } catch { return s; }
    };
    const decodedCandidate = String(candidate).split('/').map(segment => 
      segment ? safeDecode(segment) : segment
    ).join('/');

    const webPath = ('/' + decodedCandidate.replace(/\\/g, '/').replace(/^\/+/, ''));
    // Всегда открываем через play.html, чтобы унифицировать поведение в StackBlitz
    return `/play.html?file=${encodeURIComponent(webPath)}`;
  } catch {
    return false;
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'play-redirect-html-to-play',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (process.env.npm_lifecycle_event === 'play') {
            const url = req.url || '';
            // Перенаправляем прямые запросы к src/**/*.html в /play.html?file=...
            if (url.startsWith('/src/') && url.endsWith('.html') && !url.includes('html-proxy')) {
              res.statusCode = 302;
              res.setHeader('Location', `/play.html?file=${encodeURIComponent(url)}`);
              res.end();
              return;
            }
            // Поддержка алиаса @src — перенаправим /@src/... на /play.html
            if (url.startsWith('/@src/') && url.endsWith('.html') && !url.includes('html-proxy')) {
              const real = url.replace(/^\/\@src\//, '/src/');
              res.statusCode = 302;
              res.setHeader('Location', `/play.html?file=${encodeURIComponent(real)}`);
              res.end();
              return;
            }
          }
          next();
        });
        // Авто-рефреш при изменении файлов уроков
        server.watcher.on('change', (file) => {
          if (!/node_modules/.test(file) && /\/(src)\//.test(file) && /\.(html|jsx|tsx|js|ts)$/.test(file)) {
            try { server.ws.send({ type: 'full-reload' }); } catch {}
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    open: computeOpenPath(),
  },
  resolve: {
    alias: {
      '@src': '/src',
    },
  },
  appType: 'spa',
});


