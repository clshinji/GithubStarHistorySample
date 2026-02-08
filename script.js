/**
 * GitHub Star History Maker - script.js
 */

// --- State Management ---
const state = {
    githubToken: localStorage.getItem('github_token') || '',
    repositories: [], // Array of { fullName, color, starHistory, createdAt }
    chart: null,
    graphType: 'line',
    dateRange: 'full', // 'full' or 'custom'
};

const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#64748b', '#78350f'
];

// --- DOM Elements ---
const repoInput = document.getElementById('repo-input');
const addRepoBtn = document.getElementById('add-repo');
const repoList = document.getElementById('repo-list');
const rangeFull = document.getElementById('range-full');
const rangeCustom = document.getElementById('range-custom');
const customDateInputs = document.getElementById('custom-date-inputs');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const graphTypeSelect = document.getElementById('graph-type');
const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const githubTokenInput = document.getElementById('github-token');
const canvas = document.getElementById('star-chart');

// --- Initialization ---
function init() {
    setupEventListeners();
    githubTokenInput.value = state.githubToken;
    initChart();
}

function setupEventListeners() {
    // Repository Management
    addRepoBtn.addEventListener('click', () => addRepository(repoInput.value));
    repoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addRepository(repoInput.value);
    });

    // Date Range
    rangeFull.addEventListener('change', () => {
        state.dateRange = 'full';
        customDateInputs.classList.add('hidden');
        updateChart();
    });
    rangeCustom.addEventListener('change', () => {
        state.dateRange = 'custom';
        customDateInputs.classList.remove('hidden');
        updateChart();
    });
    startDateInput.addEventListener('change', updateChart);
    endDateInput.addEventListener('change', updateChart);

    // Graph Controls
    graphTypeSelect.addEventListener('change', (e) => {
        state.graphType = e.target.value;
        updateChart();
    });

    // Axis Range Controls
    document.getElementById('x-min').addEventListener('change', updateChart);
    document.getElementById('x-max').addEventListener('change', updateChart);
    document.getElementById('y-min').addEventListener('change', updateChart);
    document.getElementById('y-max').addEventListener('change', updateChart);

    // Settings Modal
    openSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
    saveSettingsBtn.addEventListener('click', () => {
        state.githubToken = githubTokenInput.value;
        localStorage.setItem('github_token', state.githubToken);
        settingsModal.classList.add('hidden');
    });
}

// --- Chart Functions ---
function initChart() {
    const ctx = canvas.getContext('2d');
    state.chart = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'month' },
                    title: { display: true, text: 'Time' }
                },
                y: {
                    title: { display: true, text: 'Stars' },
                    beginAtZero: true
                }
            }
        }
    });
}

async function updateChart() {
    if (!state.chart) return;

    const datasets = state.repositories.map(repo => {
        let data = repo.starHistory.map(p => ({ x: new Date(p.date), y: p.count }));

        // Filter by date range
        if (state.dateRange === 'custom') {
            const start = startDateInput.value ? new Date(startDateInput.value) : new Date(0);
            const end = endDateInput.value ? new Date(endDateInput.value) : new Date();
            data = data.filter(p => p.x >= start && p.x <= end);
        }

        return {
            label: repo.fullName,
            data: data,
            borderColor: repo.color,
            backgroundColor: state.graphType.includes('bar') ? repo.color : 'transparent',
            fill: state.graphType === 'stacked-bar',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 0
        };
    });

    state.chart.config.type = state.graphType === 'line' ? 'line' : 'bar';
    state.chart.options.scales.x.stacked = state.graphType === 'stacked-bar';
    state.chart.options.scales.y.stacked = state.graphType === 'stacked-bar';

    // Apply manual axis ranges
    const xMin = document.getElementById('x-min').value;
    const xMax = document.getElementById('x-max').value;
    const yMin = document.getElementById('y-min').value;
    const yMax = document.getElementById('y-max').value;

    state.chart.options.scales.x.min = xMin ? new Date(xMin) : undefined;
    state.chart.options.scales.x.max = xMax ? new Date(xMax) : undefined;
    state.chart.options.scales.y.min = yMin !== '' ? parseFloat(yMin) : undefined;
    state.chart.options.scales.y.max = yMax !== '' ? parseFloat(yMax) : undefined;

    state.chart.data.datasets = datasets;
    state.chart.update();
}

// --- GitHub API Functions ---
async function addRepository(repoUrl) {
    const fullName = extractRepoName(repoUrl);
    if (!fullName) {
        alert('Invalid repository format. Please use "owner/repo" or full URL.');
        return;
    }

    if (state.repositories.find(r => r.fullName === fullName)) {
        alert('Repository already added.');
        return;
    }

    addRepoBtn.disabled = true;
    addRepoBtn.textContent = 'Loading...';

    try {
        const repoData = await fetchRepoInfo(fullName);
        const starHistory = await fetchStarHistory(fullName, repoData.stargazers_count);
        
        const newRepo = {
            fullName: fullName,
            color: COLORS[state.repositories.length % COLORS.length],
            starHistory: starHistory,
            createdAt: repoData.created_at
        };

        state.repositories.push(newRepo);
        renderRepoList();
        updateChart();
        repoInput.value = '';
    } catch (error) {
        console.error(error);
        alert('Failed to fetch repository data. ' + error.message);
    } finally {
        addRepoBtn.disabled = false;
        addRepoBtn.textContent = 'Add';
    }
}

function extractRepoName(input) {
    const regex = /(?:github\.com\/)?([^/]+\/[^/]+?)(?:\.git|\/|$)/;
    const match = input.match(regex);
    return match ? match[1] : null;
}

async function fetchRepoInfo(fullName) {
    const headers = state.githubToken ? { 'Authorization': `token ${state.githubToken}` } : {};
    const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
    if (!res.ok) throw new Error(`Repository not found (${res.status})`);
    return await res.json();
}

async function fetchStarHistory(fullName, totalStars) {
    const headers = state.githubToken ? { 
        'Authorization': `token ${state.githubToken}`,
        'Accept': 'application/vnd.github.v3.star+json'
    } : {
        'Accept': 'application/vnd.github.v3.star+json'
    };

    const sampleCount = 30;
    const starHistory = [];
    
    // Add point at 0
    const repoInfo = await fetchRepoInfo(fullName);
    starHistory.push({ date: repoInfo.created_at, count: 0 });

    if (totalStars === 0) return starHistory;

    // GitHub API restriction: only first ~40,000 stargazers (400 pages) are accessible
    const GITHUB_PAGE_LIMIT = 400;
    const accessibleStars = Math.min(totalStars, GITHUB_PAGE_LIMIT * 100);
    const maxPages = Math.ceil(accessibleStars / 100);
    const pagesToFetch = [];
    
    if (maxPages <= sampleCount) {
        for (let i = 1; i <= maxPages; i++) pagesToFetch.push(i);
    } else {
        // Distribute samples more densely for high star counts
        for (let i = 0; i < sampleCount; i++) {
            const page = Math.max(1, Math.floor((i / (sampleCount - 1)) * (maxPages - 1)) + 1);
            if (!pagesToFetch.includes(page)) pagesToFetch.push(page);
        }
    }
    
    console.log(`Fetching star history for ${fullName}. Total: ${totalStars}, Sampling pages: ${pagesToFetch}`);

    for (const page of pagesToFetch) {
        try {
            const res = await fetch(`https://api.github.com/repos/${fullName}/stargazers?per_page=100&page=${page}`, { headers });
            if (!res.ok) {
                if (res.status === 403) throw new Error('API rate limit exceeded. Please add a GitHub Token.');
                // If 422, we might have hit a limit even before page 400 for some reason, just skip
                if (res.status === 422) {
                    console.warn(`Reached GitHub API limit at page ${page}`);
                    break; 
                }
                throw new Error(`Failed to fetch stargazers (${res.status})`);
            }
            const data = await res.json();
            if (data.length > 0) {
                starHistory.push({
                    date: data[0].starred_at,
                    count: (page - 1) * 100
                });
            }
        } catch (e) {
            console.error(`Error fetching page ${page}:`, e);
            if (e.message.includes('rate limit')) throw e;
            // For other errors, continue to get as much data as possible
        }
    }

    // Add current point (always use totalStars for the latest point)
    starHistory.push({ date: new Date().toISOString(), count: totalStars });
    
    // Sort and remove duplicates
    return starHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// --- UI Functions ---
function renderRepoList() {
    repoList.innerHTML = '';
    state.repositories.forEach((repo, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-gray-50 p-2 rounded border';
        li.innerHTML = `
            <div class="flex items-center space-x-2">
                <input type="color" class="repo-item-color" value="${repo.color}" data-index="${index}">
                <span class="text-sm font-medium truncate max-w-[120px]" title="${repo.fullName}">${repo.fullName}</span>
            </div>
            <button class="remove-repo text-gray-400 hover:text-red-500" data-index="${index}">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
        `;
        repoList.appendChild(li);
    });

    // Add event listeners to list items
    document.querySelectorAll('.repo-item-color').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            state.repositories[index].color = e.target.value;
            updateChart();
        });
    });

    document.querySelectorAll('.remove-repo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = btn.closest('button').dataset.index;
            state.repositories.splice(index, 1);
            renderRepoList();
            updateChart();
        });
    });
}

// --- Launch ---
init();
