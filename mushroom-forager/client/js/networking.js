export function setupNetworking(game, socket, playerName) {
    // Handle connection
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
        
        // Send player info to server
        socket.emit('player:join', {
            name: playerName
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    
    // Initialize game with player ID
    socket.on('game:init', (data) => {
        // Initialize game with player ID
        game.initialize(data.playerId, playerName);
        
        // Add existing players
        Object.entries(data.players).forEach(([id, player]) => {
            if (id !== data.playerId) {
                game.addPlayer(id, player.name, player.position);
            }
        });
        
        // Set up mushroom states
        data.mushrooms.forEach(mushroom => {
            const localMushroom = game.state.mushrooms.find(m => m.userData.id === mushroom.id);
            if (localMushroom) {
                localMushroom.userData.collected = mushroom.collected;
                localMushroom.visible = !mushroom.collected;
            }
        });
        
        // Start sending position updates
        setInterval(() => {
            const position = game.getPlayerPosition();
            const rotation = game.getPlayerRotation();
            
            socket.emit('player:position', {
                position: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                },
                rotation: {
                    x: rotation.x,
                    y: rotation.y,
                    z: rotation.z
                }
            });
        }, 50); // Send position updates 20 times per second
    });
    
    // Handle new player joining
    socket.on('player:joined', (data) => {
        game.addPlayer(data.id, data.name, data.position);
    });
    
    // Handle player leaving
    socket.on('player:left', (data) => {
        game.removePlayer(data.id);
    });
    
    // Handle player position updates
    socket.on('player:position', (data) => {
        game.updatePlayerPosition(
            data.id,
            data.position,
            data.rotation
        );
    });
    
    // Handle mushroom collection
    socket.on('mushroom:collected', (data) => {
        game.updateMushroom(data.id, true);
    });
    
    // Handle mushroom respawn
    socket.on('mushroom:respawned', (data) => {
        const mushroom = game.state.mushrooms.find(m => m.userData.id === data.id);
        if (mushroom) {
            mushroom.position.set(data.position.x, data.position.y, data.position.z);
            mushroom.userData.type = data.type;
            mushroom.userData.value = data.value;
            mushroom.userData.collected = false;
            mushroom.visible = true;
            
            // Update the cap color
            const cap = mushroom.children[1];
            cap.material.color.setHex(data.color);
        }
    });
    
    // Callback for mushroom collection
    game.onMushroomCollected = (mushroomId) => {
        socket.emit('mushroom:collect', {
            id: mushroomId
        });
    };
}