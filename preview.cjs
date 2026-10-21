const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, 'dist');
const publicRoot = path.resolve(__dirname, 'public');
const port = Number(process.argv[2] || 5186);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.rgba32f':'application/octet-stream'};
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const name = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const safe = (base) => {const f=path.resolve(base, '.'+name); return f.startsWith(base+path.sep) ? f : null;};
    const file = [safe(root),safe(publicRoot)].find(f => f && fs.existsSync(f) && fs.statSync(f).isFile());
    if(!file) {res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(400);res.end('Bad request');}
});
server.on('error', e => {console.error(e.code === 'EADDRINUSE' ? `Port ${port} is in use. Try: node preview.cjs 5187` : e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',() => console.log(`Veil Media Studio: http://127.0.0.1:${port}`));
