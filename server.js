const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
// Servir la carpeta 'public' (asegúrate de que index.html está ahí)
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

console.log(`🚀 SERVIDOR V7 (BROADCAST) ARRANCANDO...`);

wss.on('connection', function connection(ws, req) {
  const ip = req.socket.remoteAddress;
  console.log(`[+] NUEVO CLIENTE CONECTADO (${ip}). Total: ${wss.clients.size}`);

  ws.on('message', function incoming(message) {
    const msgString = message.toString();
    console.log(`[MSG RECIBIDO] >> ${msgString}`);
    
    // --- ESTA ES LA PARTE QUE FALLABA ---
    let enviados = 0;
    wss.clients.forEach(function each(client) {
      // Enviamos a todos MENOS al que lo envió (para no hacer eco al ESP32)
      // O si quieres ver eco en el ESP32, quita el "client !== ws"
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msgString);
        enviados++;
      }
    });
    console.log(`   ↳ Rebotado a ${enviados} clientes web.`);
    // ------------------------------------
  });

  ws.on('close', () => {
    console.log(`[-] Cliente desconectado. Restantes: ${wss.clients.size}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Escuchando en puerto ${PORT}`);
});
