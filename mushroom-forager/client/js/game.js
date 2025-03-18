import * as THREE from 'three';
import { createTerrain } from './terrain.js';
import { createEnvironment } from './environment.js';
import { createPlayer } from './player.js';
import { generateMushrooms } from './mushrooms.js';
import { updateUI } from './ui.js';

export default class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.state = {
            players: {},
            mushrooms: [],
            inventory: {},
            score: 0,
            playerId: null
        };
        
        this.clock = new THREE.Clock();
        this.isRunning = false;
        
        this.setupRenderer();
        this.setupLighting();
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Set initial background and fog
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 0.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }
    
    async initialize(playerId, playerName) {
        this.state.playerId = playerId;
        
        // Create terrain
        const terrain = await createTerrain(this.scene);
        
        // Create environment (trees, rocks, etc.)
        await createEnvironment(this.scene);
        
        // Generate mushrooms
        this.state.mushrooms = await generateMushrooms(this.scene);
        
        // Create local player
        this.localPlayer = createPlayer(this.scene, this.camera, playerName);
        
        // Initialize UI
        updateUI(this.state);
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.clock.start();
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update local player
        if (this.localPlayer) {
            this.localPlayer.update(delta);
        }
        
        // Update other players
        Object.values(this.state.players).forEach(player => {
            if (player.id !== this.state.playerId) {
                player.update(delta);
            }
        });
        
        // Check for mushroom collection
        this.checkMushroomCollection();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    checkMushroomCollection() {
        if (!this.localPlayer) return;
        
        const playerPosition = this.camera.position.clone();
        
        this.state.mushrooms.forEach(mushroom => {
            if (mushroom.userData.collected) return;
            
            const distance = playerPosition.distanceTo(mushroom.position);
            
            if (distance < 2) {
                // Player is close to mushroom - handle collection
                this.collectMushroom(mushroom);
            }
        });
    }
    
    collectMushroom(mushroom) {
        mushroom.userData.collected = true;
        mushroom.visible = false;
        
        // Update inventory
        const mushroomType = mushroom.userData.type;
        this.state.inventory[mushroomType] = (this.state.inventory[mushroomType] || 0) + 1;
        
        // Update score
        this.state.score += mushroom.userData.value;
        
        // Update UI
        updateUI(this.state);
        
        // Notify server of collection
        if (this.onMushroomCollected) {
            this.onMushroomCollected(mushroom.userData.id);
        }
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    addPlayer(playerId, playerName, position) {
        if (playerId === this.state.playerId) return;
        
        const player = createPlayer(this.scene, null, playerName);
        player.id = playerId;
        player.setPosition(position);
        
        this.state.players[playerId] = player;
        
        // Update UI
        updateUI(this.state);
    }
    
    removePlayer(playerId) {
        if (!this.state.players[playerId]) return;
        
        this.state.players[playerId].remove(this.scene);
        delete this.state.players[playerId];
        
        // Update UI
        updateUI(this.state);
    }
    
    updatePlayerPosition(playerId, position, rotation) {
        if (!this.state.players[playerId] || playerId === this.state.playerId) return;
        
        this.state.players[playerId].setPosition(position);
        this.state.players[playerId].setRotation(rotation);
    }
    
    updateMushroom(mushroomId, isCollected) {
        const mushroom = this.state.mushrooms.find(m => m.userData.id === mushroomId);
        if (mushroom && !mushroom.userData.collected) {
            mushroom.userData.collected = isCollected;
            mushroom.visible = !isCollected;
        }
    }
    
    getPlayerPosition() {
        return this.camera.position.clone();
    }
    
    getPlayerRotation() {
        return this.camera.rotation.clone();
    }
}