/**
 * Show loading indicator
 */
export function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning)
 */
export function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Truncate string to a specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
export function truncateString(str, length) {
    return str.length > length ? str.substring(0, length) + '...' : str;
}

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
async function fetchGithubData(owner, repo, path, branch = "main", outputFormat = "json") {
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