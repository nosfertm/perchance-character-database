import { Octokit } from "https://esm.sh/@octokit/core";

// Utility functions for GitHub data fetching
const GithubUtils = {
    /**
     * Fetch data from GitHub repository with optional content processing.
     * 
     * @param {string} owner - Repository owner.
     * @param {string} repo - Repository name. 
     * @param {string} path - File path within the repository.
     * @param {string} branch - Branch name (default: "main").
     * @param {string} outputFormat - Desired output format: "json" (default) or "base64".
     * @returns {Promise<any>} - Decoded file content.
     */
    async fetchGithubData(owner, repo, path, branch = "main", outputFormat = "json") {
        try {
            console.log(`Fetching file from GitHub: ${owner}/${repo}/${path} (branch: ${branch})`);
            
            const octokit = new Octokit();
            const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
                owner,
                repo,
                path,
                ref: branch,
                headers: {
                    "x-github-api-version": "2022-11-28",
                },
            });

            console.log("GitHub API response received.");

            if (!response.data || !response.data.content) {
                throw new Error("File content is empty or undefined.");
            }

            console.log(`Content encoding: ${response.data.encoding}`);

            if (outputFormat === "base64") {
                console.log("Returning raw Base64 content.");
                return response.data.content;  // Return as Base64
            } else if (outputFormat === "json") {
                const decodedContent = atob(response.data.content);
                console.log(`Decoded content length: ${decodedContent.length} characters`);

                const jsonData = JSON.parse(decodedContent);
                console.log("JSON content parsed successfully.");
                return jsonData;
            } else {
                throw new Error(`Invalid outputFormat: ${outputFormat}`);
            }
        } catch (error) {
            console.error("Error fetching or processing GitHub data:", error.message);
            throw error;
        }
    }
};

const Misc = {
    /**
     * Emit a console log based on the debug flag.
     * @param {boolean} showMessage - Whether or not to show the message.
     * @param {string} message - The log message to display.
     * @param {...any} additionalParams - Additional parameters to log.
     */
    counter: 1,
    debug(showMessage, message, ...additionalParams) {
        if (showMessage) {
            console.log(`[${this.counter}] ${message}`, ...additionalParams);
            this.counter++;
        }
    }
};

const ToastUtils = {
    /**
     * Initialize toast container if it doesn't exist
     */
    initToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
        }
    },


    isDarkMode() {
        return localStorage.getItem('siteTheme') === 'dark';
    },

    getIconForType(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-octagon',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    },

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} title - Toast title
     * @param {string} type - Toast type (success, error, warning, info)
     */
    showToast(message, title = 'Notification', type = 'info') {
        this.initToastContainer();

        const toastId = 'toast_' + Date.now();
        const darkMode = this.isDarkMode();
        const icon = this.getIconForType(type);
        
        const toastHTML = `
            <div id="${toastId}" class="toast ${darkMode ? 'bg-dark' : ''}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${darkMode ? 'bg-dark text-white border-secondary' : ''}">
                    <i class="bi bi-${icon} me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <small class="${darkMode ? 'text-white-50' : ''}"">just now</small>
                    <button type="button" class="btn-close ${darkMode ? 'btn-close-white' : ''}" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body ${darkMode ? 'text-white' : ''}">
                    ${message}
                </div>
            </div>
        `;

        const container = document.querySelector('.toast-container');
        container.insertAdjacentHTML('beforeend', toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
};

// Export GithubUtils
export { GithubUtils, Misc, ToastUtils };