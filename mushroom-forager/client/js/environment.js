import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export async function createEnvironment(scene) {
    // Create trees, rocks, and other environmental elements
    await createTrees(scene);
    await createRocks(scene);
    
    // Create skybox
    createSkybox(scene);
    
    return {
        update: function(delta) {
            // Update any animated environmental elements
        }
    };
}

async function createTrees(scene) {
    const simplex = createNoise2D();
    const trees = [];
    
    // Place trees procedurally
    for (let i = 0; i < 100; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        
        // Use noise to determine if a tree should be placed
        const noise = simplex(x * 0.02, z * 0.02);
        
        if (noise > 0.3) {
            const tree = createTree(x, z);
            scene.add(tree);
            trees.push(tree);
        }
    }
    
    return trees;
}

function createTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Foliage
    const foliageGeometry = new THREE.ConeGeometry(3, 6, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 8;
    foliage.castShadow = true;
    treeGroup.add(foliage);
    
    // Get terrain height at this position (simplified)
    const simplex = createNoise2D();
    const noise = simplex(x * 0.01, z * 0.01);
    const y = noise * 10;
    
    treeGroup.position.set(x, y, z);
    
    return treeGroup;
}

async function createRocks(scene) {
    const simplex = createNoise2D();
    const rocks = [];
    
    // Place rocks procedurally
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Get terrain height at this position
        const noise = simplex(x * 0.01, z * 0.01);
        const y = noise * 10 + 0.1;
        
        // Only place rocks in certain areas
        const placementNoise = simplex(x * 0.05, z * 0.05);
        
        if (placementNoise > 0.4) {
            const rock = createRock(x, y, z);
            scene.add(rock);
            rocks.push(rock);
        }
    }
    
    return rocks;
}

function createRock(x, y, z) {
    // Create random rock shape
    const segments = 8;
    const radius = 0.5 + Math.random() * 1.5;
    
    const geometry = new THREE.DodecahedronGeometry(radius, 0);
    
    // Distort vertices for more natural look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positions, i);
        
        // Random distortion
        vertex.x += (Math.random() - 0.5) * 0.2 * radius;
        vertex.y += (Math.random() - 0.5) * 0.2 * radius;
        vertex.z += (Math.random() - 0.5) * 0.2 * radius;
        
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    
    // Rock material
    const material = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.9,
        metalness: 0.1
    });
    
    const rock = new THREE.Mesh(geometry, material);
    rock.position.set(x, y, z);
    rock.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    return rock;
}

function createSkybox(scene) {
    // Create a simple sky gradient using a large sphere
    const skyGeometry = new THREE.SphereGeometry(900, 32, 32);
    
    // Reverse the geometry so we can see the inside of the sphere
    skyGeometry.scale(-1, 1, 1);
    
    // Sky material with vertex colors for gradient
    const skyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color(0x0077FF) },
            bottomColor: { value: new THREE.Color(0x87CEEB) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `,
        side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    return sky;
}