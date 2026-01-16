const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
// AlwaysData asigna puerto e IP por variables de entorno
const port = process.env.PORT || 8100;
const host = process.env.IP || '0.0.0.0';

// Servir la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Memoria volátil del servidor
let lastEspStatus = { online: false, timestamp: 0 };

console.log(`?? Bridge Zigbee iniciado en ${host}:${port}`);

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] Nueva conexión: ${ip}`);

    // 1. Al conectarse un navegador, enviarle el último estado conocido del ESP32
    if (lastEspStatus.timestamp > 0) {
        ws.send(JSON.stringify({
            type: 'ESP_STATUS', 
            online: lastEspStatus.online,
            cached: true
        }));
    }

    ws.on('message', (message) => {
        try {
            const msgStr = message.toString();
            const data = JSON.parse(msgStr);

            // 2. Si es un latido o estado del ESP32, actualizamos la memoria
            if (data.type === 'ESP_STATUS') {
                lastEspStatus = { online: data.online, timestamp: Date.now() };
            }

            // 3. BROADCAST: Reenviar a TODOS (Navegadores y ESP32)
            // Esto permite que:
            // - El ESP32 hable a la Web
            // - La Web mande comandos al ESP32
            wss.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(msgStr);
                }
            });
            
            // Log ligero para no saturar consola en producción
            if (data.type !== 'PING') {
                console.log(`Túnel >> ${msgStr}`);
            }

        } catch (e) {
            console.error("Error procesando mensaje:", e);
        }
    });

    ws.on('close', () => console.log('? Cliente desconectado'));
});

server.listen(port, host, () => {
    console.log(`? Servidor escuchando en http://${host}:${port}`);
});