import { showLoading, hideLoading, showToast } from '../utils.js';
import CONFIG from '../config.js';

let currentCharacter = null;

/**
 * Initialize character carousel
 */
export function initCarousel() {
    document.addEventListener('showCharacter', (event) => {
        const { character } = event.detail;
        showCharacterDetails(character);
    });

    document.getElementById('closeModal').addEventListener('click', hideCarousel);
}

/**
 * Show character details in the carousel modal
 * @param {Object} character - Character data
 */
async function showCharacterDetails(character) {
    currentCharacter = character;
    showLoading();

    try {
        const manifest = await loadManifest(character.path);

        document.getElementById('modalCharacterName').textContent = manifest.name;
        document.getElementById('modalCharacterImage').src = `${character.path}/preview.jpg`;
        document.getElementById('characterDescription').textContent = manifest.description;
        document.getElementById('characterDetails').innerHTML = generateDetailsHTML(manifest);
        
        document.getElementById('characterLink').href = manifest.link;
        document.getElementById('githubLink').href = `${CONFIG.repoBase}/${character.path}`;
        
        setupDownloadButton(character);
        document.getElementById('characterModal').style.display = 'flex';
    } catch (error) {
        console.error('Failed to load character manifest:', error);
        showToast('Failed to load character details', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Hide the character carousel modal
 */
function hideCarousel() {
    document.getElementById('characterModal').style.display = 'none';
    currentCharacter = null;
}

/**
 * Load manifest.json file for a character
 * @param {string} path - Path to the character directory
 * @returns {Promise<Object>} - Manifest data
 */
async function loadManifest(path) {
    const response = await fetch(`${path}/manifest.json`);
    if (!response.ok) {
        throw new Error('Manifest not found');
    }
    return await response.json();
}

/**
 * Generate HTML for character details section
 * @param {Object} manifest - Manifest data
 * @returns {string} - HTML string
 */
function generateDetailsHTML(manifest) {
    return `
        <p><strong>Author:</strong> ${manifest.author}</p>
        <p><strong>ShapeShifter Pulls:</strong> ${manifest.shapeShifter_Pulls}</p>
        <p><strong>Categories:</strong> ${Object.entries(manifest.categories).map(([key, value]) => `${key}: ${value}`).join(', ')}</p>
    `;
}

/**
 * Setup download button functionality
 * @param {Object} character - Character data
 */
function setupDownloadButton(character) {
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.onclick = async () => {
        try {
            showLoading();
            const response = await fetch(`${character.path}/character.zip`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${character.name}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast('Download successful', 'success');
        } catch (error) {
            console.error('Download failed:', error);
            showToast('Failed to download character', 'error');
        } finally {
            hideLoading();
        }
    };
}
