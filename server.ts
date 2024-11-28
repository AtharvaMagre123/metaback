import { WebSocketServer, WebSocket } from 'ws';  // Import WebSocket type
import { v4 as uuidv4 } from 'uuid';

// WebSocket server setup
const port = process.env.PORT || 80;
const wss = new WebSocketServer({ port: 80 });
const players = new Map<string, { ws: WebSocket, x: number, y: number }>();

wss.on('connection', (ws: WebSocket) => {
    const playerId = uuidv4();  // Generate unique player ID
    players.set(playerId, { ws, x: 250, y: 300 });  // Set initial position

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
    ws.on('message', (data: string) => {
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
function broadcast(message: any, excludeId?: string) {
    players.forEach((player, id) => {
        if (id !== excludeId) {
            player.ws.send(JSON.stringify(message));
        }
    });
}

console.log("WebSocket server running on ws://localhost:3000");
