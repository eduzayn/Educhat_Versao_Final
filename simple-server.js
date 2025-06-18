#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const html = fs.readFileSync('./landing.html', 'utf8');
    res.writeHead(200);
    res.end(html);
  } catch (error) {
    res.writeHead(500);
    res.end('Erro ao carregar a página');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Landing page EduChat rodando em http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());