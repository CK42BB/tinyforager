class GameState {
    constructor() {
        this.players = {};
        this.mushrooms = [];
        this.initialized = false;
    }
    
    initialize() {
        this.initialized = true;
    }
    
    // Player methods
    addPlayer(id, name) {
        this.players[id] = {
            id: id,
            name: name,
            position: { x: 0, y: 1.6, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            inventory: {},
            score: 0
        };
        
        return this.players[id];
    }
    
    removePlayer(id) {
        if (this.players[id]) {
            delete this.players[id];
            return true;
        }
        
        return false;
    }
    
    getPlayer(id) {
        return this.players[id] || null;
    }
    
    getPlayers() {
        return this.players;
    }
    
    updatePlayerPosition(id, position, rotation) {
        if (this.players[id]) {
            this.players[id].position = position;
            this.players[id].rotation = rotation;
            return true;
        }
        
        return false;
    }
    
    getPlayerPosition(id) {
        if (this.players[id]) {
            return this.players[id].position;
        }
        
        return { x: 0, y: 0, z: 0 };
    }
    
    updatePlayerScore(id, points) {
        if (this.players[id]) {
            this.players[id].score += points;
            return this.players[id].score;
        }
        
        return 0;
    }
    
    updatePlayerInventory(id, mushroomType) {
        if (this.players[id]) {
            if (!this.players[id].inventory[mushroomType]) {
                this.players[id].inventory[mushroomType] = 0;
            }
            
            this.players[id].inventory[mushroomType]++;
            return this.players[id].inventory;
        }
        
        return {};
    }
    
    // Mushroom methods
    addMushroom(mushroom) {
        this.mushrooms.push(mushroom);
        return mushroom;
    }
    
    getMushroom(id) {
        return this.mushrooms.find(m => m.id === id) || null;
    }
    
    getMushrooms() {
        return this.mushrooms;
    }
    
    updateMushroom(id, properties) {
        const mushroom = this.getMushroom(id);
        
        if (mushroom) {
            Object.assign(mushroom, properties);
            return mushroom;
        }
        
        return null;
    }
}

module.exports = GameState;