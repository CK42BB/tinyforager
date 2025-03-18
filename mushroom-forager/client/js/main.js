import Game from './game.js';
import { setupEventListeners } from './controls.js';
import { setupNetworking } from './networking.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Handle login
    const loginScreen = document.getElementById('login-screen');
    const playerNameInput = document.getElementById('player-name');
    const startButton = document.getElementById('start-game');
    
    startButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim() || 'Forager' + Math.floor(Math.random() * 1000);
        
        // Hide login screen
        loginScreen.style.display = 'none';
        
        // Initialize game
        initGame(playerName);
    });
});

function initGame(playerName) {
    // Create game instance
    const game = new Game();
    
    // Initialize socket connection
    const socket = io();
    
    // Setup network handlers
    setupNetworking(game, socket, playerName);
    
    // Setup event listeners
    setupEventListeners(game);
    
    // Start game loop
    game.start();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        game.handleResize();
    });
}