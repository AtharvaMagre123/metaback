"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws"); // Import WebSocket type
const uuid_1 = require("uuid");
// WebSocket server setup
const port = process.env.PORT || 3000;
const wss = new ws_1.WebSocketServer({ port: Number(port) });
const players = new Map();
wss.on('connection', (ws) => {
    const playerId = (0, uuid_1.v4)(); // Generate unique player ID
    players.set(playerId, { ws, x: 250, y: 300 }); // Set initial position
    // Send player ID to the client
    ws.send(JSON.stringify({ type: 'playerId', id: playerId }));
    players.forEach((player, id) => {
        if (id !== playerId) {
            ws.send(JSON.stringify({
                type: 'playerJoined',
                id: id,
                x: player.x,
                y: player.y
            }));
        }
    });
    // Broadcast new player to other clients
    broadcast({
        type: 'playerJoined',
        id: playerId,
        x: 250,
        y: 300
    }, playerId);
    // Listen for messages from the client
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'move') {
            // Update player position and broadcast to others
            const player = players.get(playerId);
            if (player) {
                player.x = message.x;
                player.y = message.y;
                broadcast({
                    type: 'playerMoved',
                    id: playerId,
                    x: player.x,
                    y: player.y,
                    anim: message.anim,
                    flipX: message.flipX
                }, playerId);
            }
        }
    });
    // Handle player disconnect
    ws.on('close', () => {
        players.delete(playerId);
        broadcast({ type: 'playerLeft', id: playerId });
    });
});
// Broadcast message to all connected players except the sender
function broadcast(message, excludeId) {
    players.forEach((player, id) => {
        if (id !== excludeId) {
            player.ws.send(JSON.stringify(message));
        }
    });
}
console.log("WebSocket server running on ws://localhost:3000");
