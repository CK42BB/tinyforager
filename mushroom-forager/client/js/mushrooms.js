import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// Mushroom types
const mushroomTypes = [
    { name: 'Common', color: 0xFFB6C1, value: 1, rarity: 0.6 },
    { name: 'Boletus', color: 0xCD853F, value: 3, rarity: 0.3 },
    { name: 'Chanterelle', color: 0xFFD700, value: 5, rarity: 0.15 },
    { name: 'Death Cap', color: 0x556B2F, value: -10, rarity: 0.05 },
    { name: 'Amanita', color: 0xFF0000, value: 8, rarity: 0.1 }
];

export async function generateMushrooms(scene) {
    const mushrooms = [];
    const simplex = createNoise2D();
    
    // Create mushroom instances
    for (let i = 0; i < 200; i++) {
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Get terrain height at this position (simplified)
        const noise = simplex(x * 0.01, z * 0.01);
        const y = noise * 10 + 0.1; // Slightly above terrain
        
        // Random value to determine mushroom type
        const randomValue = Math.random();
        let cumulativeRarity = 0;
        let selectedType = mushroomTypes[0];
        
        for (const type of mushroomTypes) {
            cumulativeRarity += type.rarity;
            if (randomValue <= cumulativeRarity) {
                selectedType = type;
                break;
            }
        }
        
        const mushroom = createMushroom(selectedType, x, y, z, i);
        scene.add(mushroom);
        mushrooms.push(mushroom);
    }
    
    return mushrooms;
}

function createMushroom(type, x, y, z, id) {
    const mushroomGroup = new THREE.Group();
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFAFA });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.2;
    stem.castShadow = true;
    mushroomGroup.add(stem);
    
    // Cap
    const capGeometry = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMaterial = new THREE.MeshStandardMaterial({ color: type.color });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 0.4;
    cap.rotation.x = Math.PI;
    cap.castShadow = true;
    mushroomGroup.add(cap);
    
    // Set position and data
    mushroomGroup.position.set(x, y, z);
    
    mushroomGroup.userData = {
        id: id,
        type: type.name,
        value: type.value,
        collected: false
    };
    
    return mushroomGroup;
}

export function respawnMushroom(scene, mushroom) {
    // Create a new mushroom to replace the collected one
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    
    // Get terrain height
    const simplex = createNoise2D();
    const noise = simplex(x * 0.01, z * 0.01);
    const y = noise * 10 + 0.1;
    
    // Random type
    const randomValue = Math.random();
    let cumulativeRarity = 0;
    let selectedType = mushroomTypes[0];
    
    for (const type of mushroomTypes) {
        cumulativeRarity += type.rarity;
        if (randomValue <= cumulativeRarity) {
            selectedType = type;
            break;
        }
    }
    
    // Set new position and reset collected status
    mushroom.position.set(x, y, z);
    mushroom.userData.type = selectedType.name;
    mushroom.userData.value = selectedType.value;
    mushroom.userData.collected = false;
    
    // Update cap color
    const cap = mushroom.children[1];
    cap.material.color.setHex(selectedType.color);
    
    // Show the mushroom
    mushroom.visible = true;
    
    return mushroom;
}