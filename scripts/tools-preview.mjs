import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Serve the standalone PWA unchanged: development transforms break offline imports.
const publicRoot=path.resolve(fileURLToPath(new URL('../frontend/public/',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
const port=Number(process.env.TOOLS_PORT||5180);
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(['/', '/woodpilot-mobile','/woodpilot-mobile/'].includes(pathname)){
      res.writeHead(302,{Location:'/woodpilot-mobile/index.html'});res.end();return;
    }
    const relative=pathname.slice(1),file=path.resolve(publicRoot,relative);
    const allowed=relative.startsWith('woodpilot-mobile/')||relative==='agencement-configurator/panel-nesting.js';
    if(!allowed||!file.startsWith(publicRoot+path.sep)||!mime[path.extname(file)]||!['GET','HEAD'].includes(req.method)){
      res.writeHead(404);res.end();return;
    }
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(404);res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`WoodPilot outils : http://localhost:${port}/woodpilot-mobile/index.html`));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
