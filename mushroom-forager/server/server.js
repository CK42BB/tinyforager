const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const GameState = require('./game-state');
const PlayerManager = require('./player-manager');
const MushroomManager = require('./mushroom-manager');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Initialize game components
const gameState = new GameState();
const playerManager = new PlayerManager(gameState);
const mushroomManager = new MushroomManager(gameState);

// Setup Socket.IO events
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    
    // Handle player joining
    socket.on('player:join', (data) => {
        console.log('Player joined:', socket.id, data.name);
        
        // Add player to game
        playerManager.addPlayer(socket.id, data.name);
        
        // Send initial game state to player
        socket.emit('game:init', {
            playerId: socket.id,
            players: gameState.getPlayers(),
            mushrooms: gameState.getMushrooms()
        });
        
        // Notify other players
        socket.broadcast.emit('player:joined', {
            id: socket.id,
            name: data.name,
            position: gameState.getPlayerPosition(socket.id)
        });
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        // Remove player from game
        playerManager.removePlayer(socket.id);
        
        // Notify other players
        socket.broadcast.emit('player:left', {
            id: socket.id
        });
    });
    
    // Handle player position updates
    socket.on('player:position', (data) => {
        // Update player position in game state
        playerManager.updatePlayerPosition(socket.id, data.position, data.rotation);
        
        // Broadcast to other players
        socket.broadcast.emit('player:position', {
            id: socket.id,
            position: data.position,
            rotation: data.rotation
        });
    });
    
    // Handle mushroom collection
    socket.on('mushroom:collect', (data) => {
        console.log('Mushroom collected:', data.id, 'by', socket.id);
        
        // Mark mushroom as collected
        const result = mushroomManager.collectMushroom(data.id, socket.id);
        
        if (result.success) {
            // Broadcast collection to all players
            io.emit('mushroom:collected', {
                id: data.id,
                playerId: socket.id
            });
            
            // Schedule mushroom respawn
            setTimeout(() => {
                const respawnData = mushroomManager.respawnMushroom(data.id);
                
                // Broadcast respawn to all players
                io.emit('mushroom:respawned', respawnData);
            }, 30000); // Respawn after 30 seconds
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3069;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize game state
    gameState.initialize();
    
    // Generate initial mushrooms
    mushroomManager.generateMushrooms();
    
    console.log('Game started!');
});