import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export async function createTerrain(scene) {
    // Create noise function
    const simplex = createNoise2D();
    
    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(2000, 2000, 128, 128);
    
    // Modify vertices based on noise
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Generate terrain height
        const noise = simplex(x * 0.01, z * 0.01);
        vertices[i + 1] = noise * 10;
    }
    
    // Update geometry
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Create terrain material
    const material = new THREE.MeshStandardMaterial({
        color: 0x355E3B,
        roughness: 0.8,
        metalness: 0.2
    });
    
    // Create terrain mesh
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    
    // Add to scene
    scene.add(terrain);
    
    // Create a collision map for the terrain
    const collisionMap = createTerrainCollisionMap(vertices, 128, 128);
    
    return {
        mesh: terrain,
        collisionMap: collisionMap,
        getHeightAt: function(x, z) {
            // Calculate terrain height at the given position
            const terrainSize = 2000;
            const halfSize = terrainSize / 2;
            
            // Convert world coordinates to grid coordinates
            const gridX = Math.floor((x + halfSize) / terrainSize * 128);
            const gridZ = Math.floor((z + halfSize) / terrainSize * 128);
            
            // Ensure we're within bounds
            if (gridX < 0 || gridX >= 128 || gridZ < 0 || gridZ >= 128) {
                return 0;
            }
            
            // Get height from collision map
            return collisionMap[gridZ * 128 + gridX];
        }
    };
}

function createTerrainCollisionMap(vertices, width, height) {
    const collisionMap = new Float32Array(width * height);
    
    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const index = z * width + x;
            const vertexIndex = index * 3 + 1; // +1 to get Y component
            
            collisionMap[index] = vertices[vertexIndex];
        }
    }
    
    return collisionMap;
}