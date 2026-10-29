// Minimal static server for a built site, mounted at the site's base path, with gzip like the real host.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};
const COMPRESSIBLE = /^(text\/|application\/json|image\/svg)/;

/** Serves `outDir` at `base` on a free port. Returns the site URL and a close function. */
export async function serve(outDir, base) {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) {
      res.writeHead(404).end();
      return;
    }
    let file = path.join(outDir, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file.startsWith(outDir) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
    let body = readFileSync(file);
    const headers = { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000' };
    if (COMPRESSIBLE.test(type) && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(200, headers).end(body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}${prefix}`, close: () => new Promise((r) => server.close(r)) };
}
