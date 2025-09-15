#!/usr/bin/env node
let exec;
try {
  // В StackBlitz child_process недоступен — ловим ошибку и используем fallback
  ({ exec } = await import('node:child_process'));
} catch (_) {
  exec = null;
}
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const noServe = args.includes('--no-serve');
const fileArg = args.find((a) => !a.startsWith('-'));

if (!fileArg) {
  console.error('Укажите путь к файлу: npm run play -- [--no-serve] src/путь/к/файлу.{jsx,html}');
  process.exit(1);
}

const absolute = resolve(process.cwd(), fileArg);
if (!existsSync(absolute)) {
  console.error(`Файл не найден: ${fileArg}`);
  process.exit(1);
}

const webPath = ('/' + fileArg.replace(/\\/g, '/').replace(/^\/+/, ''));

const url = webPath.endsWith('.html')
  ? webPath
  : `/play.html?file=` + encodeURIComponent(webPath);

const cmd = `npm run dev -- --open ${url}`;
if (exec && !noServe) {
  console.log(cmd);
  exec(cmd, { stdio: 'inherit' });
} else {
  // Fallback для StackBlitz: просто выводим URL, чтобы открыть его в превью
  console.log('Откройте этот URL в браузере/превью:');
  console.log(url);
}


