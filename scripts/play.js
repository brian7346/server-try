#!/usr/bin/env node
let exec;
try {
  // В StackBlitz child_process недоступен — ловим ошибку и используем fallback
  ({ exec } = await import('node:child_process'));
} catch (_) {
  exec = null;
}
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const noServe = args.includes('--no-serve');
let fileArg = args.find((a) => !a.startsWith('-'));

// StackBlitz-friendly: берём путь из env или файла, если аргумент не передан
if (!fileArg) {
  fileArg = process.env.STACKBLITZ_FILE || process.env.PLAY_FILE || '';
}
if (!fileArg) {
  try {
    if (existsSync('play-target.txt')) {
      const txt = readFileSync('play-target.txt', 'utf8').trim();
      if (txt) fileArg = txt;
    }
  } catch {}
}

if (!fileArg) {
  console.error('Не указан файл. Укажите одним из способов:');
  console.error('  1) npm run play -- [--no-serve] @src/путь/к/файлу.{html,jsx,tsx,js,ts}');
  console.error('  2) переменная окружения STACKBLITZ_FILE или PLAY_FILE');
  console.error('  3) файл play-target.txt в корне репозитория');
  process.exit(1);
}

// Нормализуем путь для файловой системы: @src/* -> src/*, удаляем query/hash
function toFsAbsolute(p) {
  const unix = String(p).replace(/\\/g, '/');
  const base = unix.split('#')[0].split('?')[0];
  const noLead = base.replace(/^\/+/, '');
  const withSrc = noLead.replace(/^@src\//, 'src/');
  return resolve(process.cwd(), withSrc);
}

const absolute = toFsAbsolute(fileArg);
if (!existsSync(absolute)) {
  console.error(`Файл не найден: ${fileArg}`);
  process.exit(1);
}

const webPath = ('/' + fileArg.replace(/\\/g, '/').replace(/^\/+/, ''));

// Правильно кодируем кириллические символы для URL
const encodedWebPath = webPath.split('/').map(segment => 
  segment ? encodeURIComponent(segment) : segment
).join('/');

// Всегда открываем через play.html для единообразия и корректной работы в StackBlitz
const url = `/play.html?file=` + encodeURIComponent(webPath);

const cmd = `npm run dev -- --open ${url}`;
if (exec && !noServe) {
  console.log(cmd);
  exec(cmd, { stdio: 'inherit' });
} else {
  // Fallback для StackBlitz: просто выводим URL, чтобы открыть его в превью
  console.log('Откройте этот URL в браузере/превью:');
  console.log(url);
}


