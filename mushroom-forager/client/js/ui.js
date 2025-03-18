export function updateUI(gameState) {
    // Update score
    document.getElementById('score').textContent = gameState.score;
    
    // Update position
    if (gameState.players[gameState.playerId]) {
        const playerPosition = gameState.players[gameState.playerId].position;
        const position = `${playerPosition.x.toFixed(1)}, ${playerPosition.y.toFixed(1)}, ${playerPosition.z.toFixed(1)}`;
        document.getElementById('position').textContent = position;
    }
    
    // Update inventory
    updateInventoryUI(gameState.inventory);
    
    // Update player list
    updatePlayerListUI(gameState.players, gameState.playerId);
}

function updateInventoryUI(inventory) {
    const inventoryContainer = document.getElementById('inventory-items');
    inventoryContainer.innerHTML = '';
    
    // Mushroom types colors
    const typeColors = {
        'Common': '#FFB6C1',
        'Boletus': '#CD853F',
        'Chanterelle': '#FFD700',
        'Death Cap': '#556B2F',
        'Amanita': '#FF0000'
    };
    
    Object.entries(inventory).forEach(([type, count]) => {
        const color = typeColors[type] || '#000000';
        
        const item = document.createElement('div');
        item.className = 'mushroom-item';
        
        const icon = document.createElement('div');
        icon.className = 'mushroom-icon';
        icon.style.backgroundColor = color;
        
        const label = document.createElement('span');
        label.textContent = `${type}: ${count}`;
        
        item.appendChild(icon);
        item.appendChild(label);
        inventoryContainer.appendChild(item);
    });
}

function updatePlayerListUI(players, localPlayerId) {
    const playersList = document.getElementById('players');
    playersList.innerHTML = '';
    
    // Add all players to the list
    Object.values(players).forEach(player => {
        const playerItem = document.createElement('li');
        
        if (player.id === localPlayerId) {
            playerItem.textContent = `${player.name} (You)`;
            playerItem.style.color = '#FFFF00'; // Highlight local player
        } else {
            playerItem.textContent = player.name;
        }
        
        playersList.appendChild(playerItem);
    });
}

export function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after a delay
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}