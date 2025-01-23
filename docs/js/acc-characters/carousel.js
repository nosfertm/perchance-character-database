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
export async function showCharacterDetails(character) {
    try {
        showLoading();
        
        // Update modal content
        document.getElementById('modalCharacterName').textContent = character.manifest.name;
        document.getElementById('modalCharacterImage').src = character.manifest.characterAvatar;
        document.getElementById('characterDescription').textContent = character.manifest.description;
        
        // Character details
        const detailsHtml = `
            <p><strong>Author:</strong> ${character.manifest.author}</p>
            <p><strong>ShapeShifter Pulls:</strong> ${character.manifest.shapeShifter_Pulls || 0}</p>
            <p><strong>Categories:</strong> ${Object.entries(character.manifest.categories)
                .map(([key, value]) => `${key}: ${value}`).join(', ')}</p>
        `;
        document.getElementById('characterDetails').innerHTML = detailsHtml;
        
        // Action buttons
        const downloadButton = document.getElementById('downloadButton');
        const characterLinkButton = document.getElementById('characterLink');
        const githubLinkButton = document.getElementById('githubLink');
        
        // Download button
        if (character.downloadLink) {
            downloadButton.style.display = 'block';
            downloadButton.onclick = () => downloadCharacter(character);
        } else {
            downloadButton.style.display = 'none';
        }
        
        // Character link
        if (character.manifest.shareLink) {
            characterLinkButton.href = character.manifest.shareLink;
            characterLinkButton.style.display = 'block';
        } else {
            characterLinkButton.style.display = 'none';
        }
        
        // GitHub link
        const githubBaseUrl = `https://github.com/${CONFIG.repo.owner}/${CONFIG.repo.name}/tree/${CONFIG.repo.branch}`;
        const characterPath = character.path.replace(`https://github.com/${CONFIG.repo.owner}/${CONFIG.repo.name}/blob/${CONFIG.repo.branch}/`, '');
        
        githubLinkButton.href = `${githubBaseUrl}/${characterPath}`;
        
        // Show modal
        document.getElementById('characterModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Failed to load character details:', error);
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

export async function downloadCharacter(character) {
    try {
        if (!character.downloadLink) {
            showToast('No download link available', 'warning');
            return;
        }
        
        const response = await fetch(character.downloadLink);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.manifest.name}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Character downloaded successfully');
    } catch (error) {
        console.error('Failed to download character:', error);
        showToast('Failed to download character', 'error');
    }
}
