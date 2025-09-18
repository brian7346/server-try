#!/usr/bin/env node
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, posix } from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');
const PACKAGE_JSON_PATH = join(ROOT, 'package.json');
const MAP_PATH = join(ROOT, 'play-map.json');

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walk(full));
    } else if (e.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function toWebPath(absPath) {
  const rel = relative(ROOT, absPath);
  // Правильно обрабатываем кириллические символы в путях
  const normalizedPath = posix.join(...rel.split(/\\+/g));
  return '/@src/' + normalizedPath.replace(/^src\/?/, '');
}

function isPlayable(file) {
  return /(\.html|\.jsx|\.tsx)$/i.test(file);
}

function hashPath(p) {
  return crypto.createHash('sha1').update(p).digest('hex').slice(0, 8);
}

function main() {
  // 1) Собираем список файлов в src
  const all = walk(SRC_DIR).filter(isPlayable);

  // 2) Готовим новые скрипты
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  pkg.scripts = pkg.scripts || {};

  // Удаляем ранее сгенерированные ключи
  for (const key of Object.keys(pkg.scripts)) {
    if (key.startsWith('play:auto:')) delete pkg.scripts[key];
    if (key.startsWith('play:path:')) delete pkg.scripts[key];
    if (key.startsWith('play:src:')) delete pkg.scripts[key];
  }

  const byScript = {};
  const byPath = {};

  for (const abs of all) {
    const webPath = toWebPath(abs).replace(/^\/+/, ''); // без ведущего слэша для аргумента
    // Имя скрипта: play:@src: + путь со слэшами, заменёнными на ':'
    const name = `play:${webPath.replace(/\//g, ':')}`;
    // Передаем путь с @src — кодирование будет происходить в play.js
    pkg.scripts[name] = `node scripts/play.js ${webPath}`;
    byScript[name] = webPath;
    byPath[webPath] = name;
  }

  // 3) Сохраняем package.json и карту
  writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + '\n');
  writeFileSync(MAP_PATH, JSON.stringify({ byScript, byPath }, null, 2) + '\n');

  console.log(`Сгенерировано скриптов: ${Object.keys(byScript).length}`);
}

main();


