const { createNoise2D } = require('simplex-noise');

class WorldGenerator {
    constructor(gameState) {
        this.gameState = gameState;
        this.simplex = createNoise2D();
    }
    
    // Generate world terrain data
    generateTerrain(width = 2000, height = 2000, resolution = 128) {
        const terrain = {
            width,
            height,
            resolution,
            heightMap: new Float32Array(resolution * resolution)
        };
        
        // Generate height map using simplex noise
        for (let z = 0; z < resolution; z++) {
            for (let x = 0; x < resolution; x++) {
                const worldX = (x / resolution) * width - width / 2;
                const worldZ = (z / resolution) * height - height / 2;
                
                // Multi-octave noise for more interesting terrain
                const noise = this.generateOctavedNoise(worldX, worldZ);
                
                terrain.heightMap[z * resolution + x] = noise * 10;
            }
        }
        
        return terrain;
    }
    
    // Generate multi-octave noise for more detailed terrain
    generateOctavedNoise(x, z) {
        let noise = 0;
        let amplitude = 1;
        let frequency = 0.01;
        let maxValue = 0;
        
        // Add multiple noise frequencies
        for (let i = 0; i < 4; i++) {
            noise += this.simplex(x * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        // Normalize to -1 to 1 range
        return noise / maxValue;
    }
    
    // Generate positions for trees using noise
    generateTreePositions(count = 100, radius = 200) {
        const trees = [];
        
        for (let i = 0; i < count; i++) {
            // Random position within radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Use noise to determine if a tree should be placed
            const noise = this.simplex(x * 0.02, z * 0.02);
            
            if (noise > 0.3) {
                trees.push({ x, z });
            }
        }
        
        return trees;
    }
    
    // Get height at specific world position using the terrain data
    getHeightAtPosition(terrain, x, z) {
        // Convert world coordinates to terrain grid
        const gridX = Math.floor((x + terrain.width / 2) / terrain.width * terrain.resolution);
        const gridZ = Math.floor((z + terrain.height / 2) / terrain.height * terrain.resolution);
        
        // Bounds checking
        if (gridX < 0 || gridX >= terrain.resolution || gridZ < 0 || gridZ >= terrain.resolution) {
            return 0;
        }
        
        // Get height from terrain data
        return terrain.heightMap[gridZ * terrain.resolution + gridX];
    }
}

module.exports = WorldGenerator;