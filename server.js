const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// --- CONFIGURACIÓN ---
const app = express();
// Servimos la carpeta 'public' donde estará el index.html
app.use(express.static(path.join(__dirname, 'public')));

// Creamos el servidor HTTP (necesario para Render)
const server = http.createServer(app);

// Creamos el servidor WebSocket montado sobre el HTTP
const wss = new WebSocket.Server({ server });

console.log(`🚀 SERVIDOR V8 (BROADCAST TOTAL) ARRANCANDO...`);

wss.on('connection', function connection(ws, req) {
  // Loguear nueva conexión (útil para ver si el ESP32 conecta y desconecta)
  const ip = req.socket.remoteAddress; 
  console.log(`[+] Conexión entrante: ${ip} | Total Clientes: ${wss.clients.size}`);

  ws.on('message', function incoming(message) {
    const msgString = message.toString();
    console.log(`[MSG] >> ${msgString}`);
    
    // --- LÓGICA DE REBOTE (BROADCAST) ---
    // Enviamos el mensaje a TODOS los conectados (Navegador y ESP32)
    // Así confirmamos que el servidor está vivo.
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    });
  });

  ws.on('close', () => {
    console.log(`[-] Cliente desconectado. Quedan: ${wss.clients.size}`);
  });
});

// Render nos da el puerto en process.env.PORT, si no usamos 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor web y socket escuchando en puerto ${PORT}`);
});
