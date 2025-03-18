export function setupEventListeners(game) {
    // Setup keyboard input
    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyE':
                // Interaction key - explicitly check for mushroom collection
                game.checkMushroomCollection();
                break;
            case 'KeyM':
                // Toggle map view
                // Implementation for minimap would go here
                break;
            case 'Escape':
                // Pause game
                break;
        }
    });
    
    // Handle pointer lock state changes
    document.addEventListener('pointerlockchange', () => {
        const isLocked = document.pointerLockElement !== null;
        // Update UI or game state based on pointer lock status
    });
}