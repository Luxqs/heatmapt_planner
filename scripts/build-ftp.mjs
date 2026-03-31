import { spawn } from 'node:child_process';
import { copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
    child.on('error', reject);
  });
}

function normalizeBase(input = '/') {
  const trimmed = input.trim();
  if (!trimmed || trimmed === '/') return '/';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

async function main() {
  const basePath = normalizeBase(process.env.FTP_BASE_PATH || '/');

  await run('npx', ['vite', 'build', '--base', basePath]);

  const distDir = path.resolve('dist');
  const htaccessSrc = path.resolve('deploy/.htaccess');
  const htaccessDest = path.join(distDir, '.htaccess');

  await access(distDir, constants.F_OK);
  await copyFile(htaccessSrc, htaccessDest);

  console.log(`\nFTP deploy bundle is ready in ./dist (base path: ${basePath})`);
  console.log('Upload all files from dist/ to your target web folder via FTP.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
