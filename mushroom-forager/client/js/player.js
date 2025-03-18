import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { CONSTANTS } from '../shared/constants.js';
import { distance } from '../shared/utils.js';

// Player models and animations
const PLAYER_MODELS = {
    default: {
        color: 0x3366ff,
        height: 1.8,
        width: 0.5,
        depth: 0.5
    },
    // Could add additional models here for player customization
};

/**
 * Create and manage a player in the game world
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Camera} camera - Camera for local player (null for remote players)
 * @param {string} playerName - Player's display name
 * @returns {Object} Player object with methods for controlling and updating
 */
export function createPlayer(scene, camera, playerName) {
    const player = {
        id: null,
        name: playerName || 'Unknown Forager',
        model: null,
        controls: null,
        isLocal: false,
        
        // Movement properties
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        canJump: false,
        isSprinting: false,
        
        // Player stats
        health: 100,
        stamina: 100,
        maxStamina: 100,
        staminaRecoveryRate: 5, // Stamina recovered per second
        sprintStaminaCost: 15,  // Stamina used per second while sprinting
        
        // Inventory and game state
        inventory: {},
        score: 0,
        position: new THREE.Vector3(0, CONSTANTS.PLAYER_HEIGHT, 0),
        rotation: new THREE.Euler(),
        footstepSound: null,
        lastFootstepTime: 0,
        footstepInterval: 500, // ms between footstep sounds
        
        // Initialize player
        init: function(scene, camera) {
            if (camera) {
                this.initLocalPlayer(scene, camera);
            } else {
                this.initRemotePlayer(scene);
            }
            
            // Initialize sounds
            this.initSounds();
            
            return this;
        },
        
        // Initialize local player with camera and controls
        initLocalPlayer: function(scene, camera) {
            this.isLocal = true;
            this.camera = camera;
            
            // Setup pointer lock controls for first-person view
            this.controls = new PointerLockControls(camera, document.body);
            
            // Set initial position
            camera.position.set(0, CONSTANTS.PLAYER_HEIGHT, 0);
            this.position.copy(camera.position);
            
            // Setup control event listeners
            this.setupControlListeners();
            
            // Add click listener for pointer lock
            document.addEventListener('click', () => {
                // Only lock if not already locked and clicking in the game area
                if (document.pointerLockElement !== document.body) {
                    this.controls.lock();
                }
            });
            
            // Handle pointer lock change events
            document.addEventListener('pointerlockchange', () => {
                const isLocked = document.pointerLockElement === document.body;
                // Update UI or game state based on lock status
                if (isLocked) {
                    console.log('Controls locked - game active');
                    // Could trigger a UI update to hide menu/show game UI
                } else {
                    console.log('Controls unlocked - game paused');
                    // Could trigger a UI update to show pause menu
                    // Reset movement flags when unlocked to prevent stuck movement
                    this.moveForward = false;
                    this.moveBackward = false;
                    this.moveLeft = false;
                    this.moveRight = false;
                }
            });
            
            // Crosshair for local player (optional)
            this.createCrosshair();
        },
        
        // Initialize remote player (visible character in the game)
        initRemotePlayer: function(scene) {
            this.isLocal = false;
            
            // Create player model group
            this.model = new THREE.Group();
            
            // Get default model settings
            const modelConfig = PLAYER_MODELS.default;
            
            // Create body
            const bodyGeometry = new THREE.BoxGeometry(
                modelConfig.width, 
                modelConfig.height, 
                modelConfig.depth
            );
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: modelConfig.color 
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.castShadow = true;
            body.position.y = modelConfig.height / 2; // Bottom of model at ground level
            this.model.add(body);
            
            // Create head (slightly different color)
            const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const headMaterial = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color(modelConfig.color).offsetHSL(0, 0, 0.1)
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = modelConfig.height - 0.2; // Place on top of body
            head.castShadow = true;
            this.model.add(head);
            
            // Create arms
            const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
            const armMaterial = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color(modelConfig.color).offsetHSL(0, 0, -0.1)
            });
            
            // Left arm
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-(modelConfig.width/2 + 0.1), modelConfig.height - 0.5, 0);
            leftArm.castShadow = true;
            this.model.add(leftArm);
            
            // Right arm
            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(modelConfig.width/2 + 0.1, modelConfig.height - 0.5, 0);
            rightArm.castShadow = true;
            this.model.add(rightArm);
            
            // Add name tag floating above player
            const nameTag = this.createNameTag();
            this.model.add(nameTag);
            
            // Add player to scene
            scene.add(this.model);
            
            // Create shadow
            this.createShadow(scene);
        },
        
        // Create a floating name tag
        createNameTag: function() {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            
            // Draw background
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw border
            context.strokeStyle = 'white';
            context.lineWidth = 2;
            context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
            
            // Draw name text
            context.font = 'bold 24px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(this.name, canvas.width / 2, canvas.height / 2);
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            
            // Create sprite material with the texture
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true
            });
            
            // Create sprite and position it above player
            const sprite = new THREE.Sprite(material);
            sprite.position.set(0, PLAYER_MODELS.default.height + 0.5, 0);
            sprite.scale.set(2, 0.5, 1);
            
            return sprite;
        },
        
        // Create player shadow as a transparent circle
        createShadow: function(scene) {
            const shadowGeometry = new THREE.CircleGeometry(0.5, 32);
            const shadowMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.4,
                depthWrite: false
            });
            
            this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
            this.shadow.rotation.x = -Math.PI / 2; // Rotate to be flat on ground
            this.shadow.position.y = 0.01; // Slightly above ground to prevent z-fighting
            
            if (this.model) {
                this.model.add(this.shadow);
            }
        },
        
        // Create a simple crosshair for local player
        createCrosshair: function() {
            if (!this.isLocal) return;
            
            // Create a simple crosshair element
            const crosshair = document.createElement('div');
            crosshair.classList.add('crosshair');
            crosshair.style.position = 'absolute';
            crosshair.style.top = '50%';
            crosshair.style.left = '50%';
            crosshair.style.transform = 'translate(-50%, -50%)';
            crosshair.style.width = '10px';
            crosshair.style.height = '10px';
            crosshair.style.border = '2px solid white';
            crosshair.style.borderRadius = '50%';
            crosshair.style.pointerEvents = 'none'; // Don't block clicks
            
            document.body.appendChild(crosshair);
            this.crosshair = crosshair;
        },
        
        // Set up control event listeners for player movement
        setupControlListeners: function() {
            if (!this.isLocal) return;
            
            // Handle key down events
            document.addEventListener('keydown', (event) => {
                if (!this.controls.isLocked) return;
                
                switch (event.code) {
                    case 'KeyW':
                    case 'ArrowUp':
                        this.moveForward = true;
                        break;
                    
                    case 'KeyS':
                    case 'ArrowDown':
                        this.moveBackward = true;
                        break;
                    
                    case 'KeyA':
                    case 'ArrowLeft':
                        this.moveLeft = true;
                        break;
                    
                    case 'KeyD':
                    case 'ArrowRight':
                        this.moveRight = true;
                        break;
                    
                    case 'Space':
                        if (this.canJump) {
                            this.velocity.y = CONSTANTS.PLAYER_JUMP_FORCE * 0.1;
                            this.canJump = false;
                            // Play jump sound
                            this.playSound('jump');
                        }
                        break;
                    
                    case 'ShiftLeft':
                    case 'ShiftRight':
                        if (this.stamina > 0) {
                            this.isSprinting = true;
                        }
                        break;
                }
            });
            
            // Handle key up events
            document.addEventListener('keyup', (event) => {
                switch (event.code) {
                    case 'KeyW':
                    case 'ArrowUp':
                        this.moveForward = false;
                        break;
                    
                    case 'KeyS':
                    case 'ArrowDown':
                        this.moveBackward = false;
                        break;
                    
                    case 'KeyA':
                    case 'ArrowLeft':
                        this.moveLeft = false;
                        break;
                    
                    case 'KeyD':
                    case 'ArrowRight':
                        this.moveRight = false;
                        break;
                    
                    case 'ShiftLeft':
                    case 'ShiftRight':
                        this.isSprinting = false;
                        break;
                }
            });
            
            // Handle mouse button events for interaction
            document.addEventListener('mousedown', (event) => {
                if (!this.controls.isLocked) return;
                
                // Left click (primary action)
                if (event.button === 0) {
                    this.primaryAction();
                }
                
                // Right click (secondary action)
                if (event.button === 2) {
                    this.secondaryAction();
                }
            });
            
            // Prevent context menu on right click
            document.addEventListener('contextmenu', (event) => {
                if (this.controls.isLocked) {
                    event.preventDefault();
                }
            });
        },
        
        // Initialize player sounds
        initSounds: function() {
            // In a real implementation, you would load and manage audio files here
            // This is just a placeholder for the concept
            this.sounds = {
                footstep: null,
                jump: null,
                collect: null
            };
            
            // Example of how you would load a sound
            // const audioLoader = new THREE.AudioLoader();
            // audioLoader.load('assets/sounds/footstep.mp3', (buffer) => {
            //     this.sounds.footstep = buffer;
            // });
        },
        
        // Play a sound from the player's position
        playSound: function(soundName) {
            // In a real implementation, you would play the sound here
            console.log(`Playing sound: ${soundName}`);
            
            // Example:
            // if (this.sounds[soundName]) {
            //     const sound = new THREE.Audio(listener);
            //     sound.setBuffer(this.sounds[soundName]);
            //     sound.play();
            // }
        },
        
        // Primary action (collect mushrooms, interact with environment)
        primaryAction: function() {
            // This would be implemented in the game class that handles interactions
            // Call a callback if one is set
            if (this.onPrimaryAction) {
                this.onPrimaryAction();
            }
        },
        
        // Secondary action (inspect mushrooms, open inventory, etc.)
        secondaryAction: function() {
            // This would be implemented in the game class that handles interactions
            // Call a callback if one is set
            if (this.onSecondaryAction) {
                this.onSecondaryAction();
            }
        },
        
        // Update player position and state
        update: function(delta, terrain) {
            if (this.isLocal) {
                this.updateLocalPlayer(delta, terrain);
            } else {
                this.updateRemotePlayer(delta);
            }
            
            // Update stamina
            this.updateStamina(delta);
        },
        
        // Update local player movement and physics
        updateLocalPlayer: function(delta, terrain) {
            if (!this.controls || !this.controls.isLocked) {
                return;
            }
            
            // Get current camera position
            const camera = this.controls.getObject();
            
            // Calculate movement based on input
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize(); // Normalize for consistent speed in all directions
            
            // Determine movement speed (with sprint modifier if applicable)
            let speed = CONSTANTS.PLAYER_SPEED;
            if (this.isSprinting && this.stamina > 0) {
                speed *= 1.5; // 50% speed increase when sprinting
                this.stamina -= this.sprintStaminaCost * delta; // Reduce stamina while sprinting
            }
            
            // Apply movement
            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * speed * delta;
            }
            
            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * speed * delta;
            }
            
            // Apply gravity
            this.velocity.y -= CONSTANTS.GRAVITY * delta;
            
            // Move the camera based on velocity
            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
            camera.position.y += this.velocity.y * delta;
            
            // Get terrain height at current position
            let terrainHeight = 0;
            if (terrain && terrain.getHeightAt) {
                terrainHeight = terrain.getHeightAt(camera.position.x, camera.position.z);
            }
            
            // Ground collision detection
            const playerHeight = CONSTANTS.PLAYER_HEIGHT;
            if (camera.position.y < terrainHeight + playerHeight) {
                this.velocity.y = 0;
                camera.position.y = terrainHeight + playerHeight;
                this.canJump = true;
                
                // Play footstep sounds when moving on ground
                if ((this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) && 
                    performance.now() - this.lastFootstepTime > this.footstepInterval) {
                    this.playSound('footstep');
                    this.lastFootstepTime = performance.now();
                    
                    // Shorten footstep interval when sprinting
                    this.footstepInterval = this.isSprinting ? 300 : 500;
                }
            }
            
            // Apply drag to gradually slow movement
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
            
            // Update position for networking/state
            this.position.copy(camera.position);
            this.rotation.copy(camera.rotation);
        },
        
        // Update remote player movements (interpolate position for smoothness)
        updateRemotePlayer: function(delta) {
            if (!this.model) return;
            
            if (this.targetPosition) {
                // Smoothly interpolate to target position
                this.model.position.lerp(this.targetPosition, 0.2);
            }
            
            if (this.targetRotation) {
                // Smoothly interpolate to target rotation
                // This is a simplified approach - for Euler angles, you might want
                // to use Quaternions for proper interpolation in a real implementation
                this.model.rotation.x += (this.targetRotation.x - this.model.rotation.x) * 0.2;
                this.model.rotation.y += (this.targetRotation.y - this.model.rotation.y) * 0.2;
                this.model.rotation.z += (this.targetRotation.z - this.model.rotation.z) * 0.2;
            }
            
            // Update shadow position
            if (this.shadow) {
                this.shadow.position.y = 0.01; // Keep shadow at ground level
            }
            
            // Animate parts based on movement
            this.animateRemotePlayer(delta);
        },
        
        // Simple animations for remote players
        animateRemotePlayer: function(delta) {
            if (!this.model || !this.model.children) return;
            
            const isMoving = this.isMoving;
            
            // Animate arms when moving
            if (isMoving && this.model.children.length > 3) {
                const leftArm = this.model.children[2];
                const rightArm = this.model.children[3];
                
                // Simple pendulum arm swing
                this.animTime = (this.animTime || 0) + delta * 5;
                const swing = Math.sin(this.animTime) * 0.2;
                
                leftArm.rotation.x = -swing;
                rightArm.rotation.x = swing;
            }
        },
        
        // Update stamina regeneration
        updateStamina: function(delta) {
            if (!this.isSprinting) {
                // Regenerate stamina when not sprinting
                this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRecoveryRate * delta);
            }
            
            // If stamina is depleted, disable sprinting
            if (this.stamina <= 0) {
                this.isSprinting = false;
                this.stamina = 0;
            }
        },
        
        // Set player position
        setPosition: function(position) {
            if (this.isLocal && this.controls) {
                this.controls.getObject().position.copy(position);
                this.position.copy(position);
            } else if (this.model) {
                // For remote players, set target for smooth interpolation
                this.targetPosition = new THREE.Vector3(position.x, position.y, position.z);
                this.isMoving = this.model.position.distanceTo(this.targetPosition) > 0.01;
            }
        },
        
        // Set player rotation
        setRotation: function(rotation) {
            if (!this.isLocal && this.model) {
                // For remote players, set target for smooth interpolation
                this.targetRotation = new THREE.Euler(rotation.x, rotation.y, rotation.z);
            }
        },
        
        // Get current player position
        getPosition: function() {
            if (this.isLocal && this.controls) {
                return this.controls.getObject().position.clone();
            } else if (this.model) {
                return this.model.position.clone();
            }
            return this.position.clone();
        },
        
        // Get current player rotation
        getRotation: function() {
            if (this.isLocal && this.camera) {
                return this.camera.rotation.clone();
            } else if (this.model) {
                return this.model.rotation.clone();
            }
            return this.rotation.clone();
        },
        
        // Collect a mushroom
        collectMushroom: function(mushroomType, value) {
            // Update inventory
            this.inventory[mushroomType] = (this.inventory[mushroomType] || 0) + 1;
            
            // Update score
            this.score += value;
            
            // Play collection sound
            this.playSound('collect');
            
            return {
                inventory: this.inventory,
                score: this.score
            };
        },
        
        // Remove player from the scene
        remove: function(scene) {
            if (this.model) {
                scene.remove(this.model);
            }
            
            if (this.isLocal && this.crosshair) {
                document.body.removeChild(this.crosshair);
            }
        }
    };
    
    return player.init(scene, camera);
}