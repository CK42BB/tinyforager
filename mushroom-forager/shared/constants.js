// Game constants that are used on both client and server
const CONSTANTS = {
    // Game settings
    WORLD_SIZE: 2000,
    TERRAIN_RESOLUTION: 128,
    
    // Player settings
    PLAYER_HEIGHT: 1.6,
    PLAYER_SPEED: 5.0,
    PLAYER_JUMP_FORCE: 350,
    GRAVITY: 9.8,
    
    // Mushroom settings
    MUSHROOM_COUNT: 200,
    MUSHROOM_RESPAWN_TIME: 30000, // 30 seconds
    COLLECTION_DISTANCE: 2.0,
    
    // Network settings
    POSITION_UPDATE_RATE: 50, // ms
};

// Mushroom types shared between client and server
const MUSHROOM_TYPES = [
    { name: 'Common', color: 0xFFB6C1, value: 1, rarity: 0.6 },
    { name: 'Boletus', color: 0xCD853F, value: 3, rarity: 0.3 },
    { name: 'Chanterelle', color: 0xFFD700, value: 5, rarity: 0.15 },
    { name: 'Death Cap', color: 0x556B2F, value: -10, rarity: 0.05 },
    { name: 'Amanita', color: 0xFF0000, value: 8, rarity: 0.1 }
];

// Export in a way that works in both Node.js and browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
        CONSTANTS,
        MUSHROOM_TYPES
    };
} else {
    window.CONSTANTS = CONSTANTS;
    window.MUSHROOM_TYPES = MUSHROOM_TYPES;
}