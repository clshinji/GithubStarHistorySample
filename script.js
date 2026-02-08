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
    logScale: false,
    alignTimeline: false,
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
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
const logScaleCheck = document.getElementById('log-scale');
const alignTimelineCheck = document.getElementById('align-timeline');
const downloadPngBtn = document.getElementById('download-png');
const exportCsvBtn = document.getElementById('export-csv');
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
    
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        state.theme = e.matches ? 'dark' : 'light';
        updateChart();
    });
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
    logScaleCheck.addEventListener('change', (e) => {
        state.logScale = e.target.checked;
        updateChart();
    });
    alignTimelineCheck.addEventListener('change', (e) => {
        state.alignTimeline = e.target.checked;
        updateChart();
    });

    // Export Actions
    downloadPngBtn.addEventListener('click', downloadPng);
    exportCsvBtn.addEventListener('click', exportCsv);

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
                    title: { display: true, text: 'Stars' }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    labels: {
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

async function updateChart() {
    if (!state.chart) return;

    const isBar = state.graphType.includes('bar');
    const isStacked = state.graphType === 'stacked-bar';

    const datasets = state.repositories.map(repo => {
        let data;
        
        if (state.alignTimeline) {
            const createdDate = new Date(repo.createdAt);
            data = repo.starHistory.map(p => ({
                x: Math.floor((new Date(p.date) - createdDate) / (1000 * 60 * 60 * 24)),
                y: p.count
            }));
        } else {
            data = repo.starHistory.map(p => ({ x: new Date(p.date), y: p.count }));
        }

        if (!state.alignTimeline && state.dateRange === 'custom') {
            const start = startDateInput.value ? new Date(startDateInput.value) : new Date(0);
            const end = endDateInput.value ? new Date(endDateInput.value) : new Date();
            data = data.filter(p => p.x >= start && p.x <= end);
        }

        const color = repo.color;

        return {
            label: repo.fullName,
            data: data,
            borderColor: color,
            backgroundColor: isBar ? color + '88' : color + '22',
            fill: isStacked || state.graphType === 'line',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            barPercentage: 1,
            categoryPercentage: 1
        };
    });

    const textColor = state.theme === 'dark' ? '#e5e7eb' : '#374151';
    const gridColor = state.theme === 'dark' ? '#374151' : '#e5e7eb';

    state.chart.config.type = state.graphType === 'line' ? 'line' : 'bar';
    
    const scales = state.chart.options.scales;
    scales.x.stacked = isStacked;
    scales.y.stacked = isStacked;
    
    scales.y.type = state.logScale ? 'logarithmic' : 'linear';
    if (state.logScale) {
        let minVal = Infinity;
        state.repositories.forEach(r => {
            r.starHistory.forEach(p => {
                if (p.count > 0 && p.count < minVal) minVal = p.count;
            });
        });
        scales.y.min = minVal === Infinity ? 1 : Math.pow(10, Math.floor(Math.log10(minVal)));
    } else {
        scales.y.beginAtZero = true;
        scales.y.min = undefined;
    }

    if (state.alignTimeline) {
        scales.x.type = 'linear';
        scales.x.title.text = 'Days since creation';
    } else {
        scales.x.type = 'time';
        scales.x.title.text = 'Time';
    }

    const xMin = document.getElementById('x-min').value;
    const xMax = document.getElementById('x-max').value;
    const yMin = document.getElementById('y-min').value;
    const yMax = document.getElementById('y-max').value;

    if (state.alignTimeline) {
        scales.x.min = xMin !== '' ? parseFloat(xMin) : undefined;
        scales.x.max = xMax !== '' ? parseFloat(xMax) : undefined;
    } else {
        scales.x.min = xMin ? new Date(xMin) : undefined;
        scales.x.max = xMax ? new Date(xMax) : undefined;
    }
    if (yMin !== '') scales.y.min = parseFloat(yMin);
    if (yMax !== '') scales.y.max = parseFloat(yMax);

    scales.x.title.color = textColor;
    scales.x.ticks.color = textColor;
    scales.x.grid.color = gridColor;
    scales.y.title.color = textColor;
    scales.y.ticks.color = textColor;
    scales.y.grid.color = gridColor;
    state.chart.options.plugins.legend.labels.color = textColor;

    state.chart.data.datasets = datasets;
    state.chart.update();
}

// --- Export Functions ---
function downloadPng() {
    const link = document.createElement('a');
    link.download = 'star-history.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function exportCsv() {
    if (state.repositories.length === 0) return;
    
    let csvContent = 'repo,date,stars\n';
    state.repositories.forEach(repo => {
        repo.starHistory.forEach(p => {
            csvContent += `${repo.fullName},${p.date},${p.count}\n`;
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'star-history.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

async function fetchWithToken(url) {
    const headers = state.githubToken ? { 
        'Authorization': `token ${state.githubToken}`,
        'Accept': 'application/vnd.github.v3.star+json'
    } : {
        'Accept': 'application/vnd.github.v3.star+json'
    };
    const res = await fetch(url, { headers });
    if (res.status === 403) throw new Error('API rate limit exceeded. Please add a GitHub Token.');
    return res;
}

async function fetchStarHistory(fullName, totalStars) {
    const sampleCount = 40;
    const starHistory = [];
    
    const repoInfo = await fetchRepoInfo(fullName);
    starHistory.push({ date: repoInfo.created_at, count: 0 });

    if (totalStars === 0) return starHistory;

    const maxPage = Math.ceil(totalStars / 100);
    const pagesToFetch = [];
    for (let i = 0; i < sampleCount; i++) {
        const page = Math.max(1, Math.floor((i / (sampleCount - 1)) * (maxPage - 1)) + 1);
        if (!pagesToFetch.includes(page)) pagesToFetch.push(page);
    }
    
    const chunkSize = 8;
    for (let i = 0; i < pagesToFetch.length; i += chunkSize) {
        const chunk = pagesToFetch.slice(i, i + chunkSize);
        const results = await Promise.all(chunk.map(page => 
            fetchWithToken(`https://api.github.com/repos/${fullName}/stargazers?per_page=100&page=${page}`)
                .then(res => res.ok ? res.json() : null)
                .catch(() => null)
        ));
        
        results.forEach((data, index) => {
            if (data && data.length > 0) {
                starHistory.push({
                    date: data[0].starred_at,
                    count: (chunk[index] - 1) * 100
                });
            }
        });
    }

    starHistory.push({ date: new Date().toISOString(), count: totalStars });
    
    return starHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// --- UI Functions ---
function renderRepoList() {
    repoList.innerHTML = '';
    state.repositories.forEach((repo, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded border dark:border-gray-600';
        li.innerHTML = `
            <div class="flex items-center space-x-2">
                <input type="color" class="repo-item-color" value="${repo.color}" data-index="${index}">
                <span class="text-sm font-medium truncate max-w-[120px] dark:text-gray-200" title="${repo.fullName}">${repo.fullName}</span>
            </div>
            <button class="remove-repo text-gray-400 hover:text-red-500" data-index="${index}">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
        `;
        repoList.appendChild(li);
    });

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
