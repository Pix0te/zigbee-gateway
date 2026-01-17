const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public'))); // Sirve el index.html

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

console.log(`🚀 Servidor Render V6 arrancando...`);

wss.on('connection', function connection(ws) {
  console.log('[+] Cliente conectado');
  ws.on('message', function incoming(message) {
    const msgString = message.toString();
    console.log(`>> ${msgString}`);
    
    // Broadcast a la web
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    });
  });
});

// Render asigna el puerto automáticamente en process.env.PORT
server.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Escuchando...`);
});
