const SimplexNoise = require('simplex-noise');

// Mushroom types
const mushroomTypes = [
    { name: 'Common', color: 0xFFB6C1, value: 1, rarity: 0.6 },
    { name: 'Boletus', color: 0xCD853F, value: 3, rarity: 0.3 },
    { name: 'Chanterelle', color: 0xFFD700, value: 5, rarity: 0.15 },
    { name: 'Death Cap', color: 0x556B2F, value: -10, rarity: 0.05 },
    { name: 'Amanita', color: 0xFF0000, value: 8, rarity: 0.1 }
];

class MushroomManager {
    constructor(gameState) {
        this.gameState = gameState;
        const simplexInstance = new SimplexNoise();
        this.simplex = (x, y) => simplexInstance.noise2D(x, y);;
    }
    
    generateMushrooms(count = 200) {
        // Clear existing mushrooms
        this.gameState.mushrooms = [];
        
        // Generate new mushrooms
        for (let i = 0; i < count; i++) {
            // Random position
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            // Get terrain height at this position
            const noise = this.simplex(x * 0.01, z * 0.01);
            const y = noise * 10 + 0.1;
            
            // Random mushroom type
            const type = this.getRandomMushroomType();
            
            // Create mushroom
            const mushroom = {
                id: i,
                position: { x, y, z },
                type: type.name,
                color: type.color,
                value: type.value,
                collected: false
            };
            
            // Add to game state
            this.gameState.addMushroom(mushroom);
        }
        
        return this.gameState.getMushrooms();
    }
    
    getRandomMushroomType() {
        const randomValue = Math.random();
        let cumulativeRarity = 0;
        
        for (const type of mushroomTypes) {
            cumulativeRarity += type.rarity;
            if (randomValue <= cumulativeRarity) {
                return type;
            }
        }
        
        return mushroomTypes[0];
    }
    
    collectMushroom(mushroomId, playerId) {
        const mushroom = this.gameState.getMushroom(mushroomId);
        
        if (!mushroom || mushroom.collected) {
            return {
                success: false,
                message: 'Mushroom already collected or not found'
            };
        }
        
        // Mark as collected
        this.gameState.updateMushroom(mushroomId, { collected: true });
        
        // Update player score
        this.gameState.updatePlayerScore(playerId, mushroom.value);
        
        // Update player inventory
        this.gameState.updatePlayerInventory(playerId, mushroom.type);
        
        return {
            success: true,
            mushroom,
            player: this.gameState.getPlayer(playerId)
        };
    }
    
    respawnMushroom(mushroomId) {
        // Random position
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Get terrain height
        const noise = this.simplex(x * 0.01, z * 0.01);
        const y = noise * 10 + 0.1;
        
        // Random type
        const type = this.getRandomMushroomType();
        
        // Update mushroom
        const updatedMushroom = this.gameState.updateMushroom(mushroomId, {
            position: { x, y, z },
            type: type.name,
            color: type.color,
            value: type.value,
            collected: false
        });
        
        return updatedMushroom;
    }
    
    getMushrooms() {
        return this.gameState.getMushrooms();
    }
}

module.exports = MushroomManager;