class PlayerManager {
    constructor(gameState) {
        this.gameState = gameState;
    }
    
    addPlayer(id, name) {
        return this.gameState.addPlayer(id, name);
    }
    
    removePlayer(id) {
        return this.gameState.removePlayer(id);
    }
    
    getPlayer(id) {
        return this.gameState.getPlayer(id);
    }
    
    updatePlayerPosition(id, position, rotation) {
        return this.gameState.updatePlayerPosition(id, position, rotation);
    }
    
    updatePlayerScore(id, points) {
        return this.gameState.updatePlayerScore(id, points);
    }
    
    updatePlayerInventory(id, mushroomType) {
        return this.gameState.updatePlayerInventory(id, mushroomType);
    }
    
    getPlayerStats(id) {
        const player = this.gameState.getPlayer(id);
        
        if (player) {
            return {
                id: player.id,
                name: player.name,
                score: player.score,
                inventory: player.inventory
            };
        }
        
        return null;
    }
    
    getLeaderboard() {
        const players = Object.values(this.gameState.getPlayers());
        
        // Sort players by score
        return players
            .sort((a, b) => b.score - a.score)
            .map(player => ({
                id: player.id,
                name: player.name,
                score: player.score
            }));
    }
}

module.exports = PlayerManager;