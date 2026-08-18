import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function localDatabasePlugin() {
  return {
    name: 'local-database',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/employees' && req.method === 'GET') {
          const dbPath = path.resolve(__dirname, 'src/data/userEmployees.json');
          if (fs.existsSync(dbPath)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(dbPath));
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([]));
          }
          return;
        }
        
        if (req.url === '/api/employees' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const dbPath = path.resolve(__dirname, 'src/data/userEmployees.json');
            fs.writeFileSync(dbPath, body);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }
        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localDatabasePlugin()],
  server: {
    allowedHosts: true,
  }
})
