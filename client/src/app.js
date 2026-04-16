/**
 * Offline Git Visualizer - Frontend Application
 */

class GitVisualizerApp {
  constructor() {
    this.currentData = null;
    this.showRaw = false;
    this.graph = null;
    this.initializeElements();
    this.bindEvents();
    this.checkServerHealth();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.elements = {
      repoInput: document.getElementById('repoPath'),
      loadBtn: document.getElementById('loadBtn'),
      statusSection: document.getElementById('statusSection'),
      statusMessage: document.getElementById('statusMessage'),
      resultsSection: document.getElementById('resultsSection'),
      statsContainer: document.getElementById('statsContainer'),
      commitsContent: document.getElementById('commitsContent'),
      commitsCount: document.getElementById('commitsCount'),
      toggleRaw: document.getElementById('toggleRaw'),
      resetZoom: document.getElementById('resetZoom'),
      toggleLayout: document.getElementById('toggleLayout'),
      dateSlider: document.getElementById('dateSlider'),
      dateRange: document.getElementById('dateRange'),
      commitInfoPanel: document.getElementById('commitInfoPanel'),
      closePanel: document.getElementById('closePanel'),
      panelHash: document.getElementById('panelHash'),
      panelAuthor: document.getElementById('panelAuthor'),
      panelDate: document.getElementById('panelDate'),
      panelBranches: document.getElementById('panelBranches'),
      panelMessage: document.getElementById('panelMessage')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Input validation
    this.elements.repoInput.addEventListener('input', () => {
      this.validateInput();
    });

    // Load button click
    this.elements.loadBtn.addEventListener('click', () => {
      this.loadCommits();
    });

    // Enter key in input
    this.elements.repoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.elements.loadBtn.disabled) {
        this.loadCommits();
      }
    });

    // Toggle raw/formatted view
    this.elements.toggleRaw.addEventListener('click', () => {
      this.toggleRawView();
    });

    // Graph controls
    this.elements.resetZoom.addEventListener('click', () => {
      this.resetGraphZoom();
    });

    this.elements.toggleLayout.addEventListener('click', () => {
      this.toggleGraphLayout();
    });

    // Modal event handlers
    this.setupModalHandlers();
    
    // Date filter event listener
    this.elements.dateSlider.addEventListener('input', () => {
      this.filterByDate();
    });
    
    // Panel close button
    this.elements.closePanel.addEventListener('click', () => {
      this.hideCommitPanel();
    });
  }

  /**
   * Validate repository path input
   */
  validateInput() {
    const path = this.elements.repoInput.value.trim();
    this.elements.loadBtn.disabled = !path;
  }

  /**
   * Check server health on startup
   */
  async checkServerHealth() {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (!data.success) {
        this.showStatus('Server is not healthy. Please restart the application.', 'error');
      }
    } catch (error) {
      this.showStatus('Cannot connect to server. Please ensure the server is running.', 'error');
      console.error('Health check failed:', error);
    }
  }

  /**
   * Load commits from repository
   */
  async loadCommits() {
    const repoPath = this.elements.repoInput.value.trim();
    
    if (!repoPath) {
      this.showStatus('Please enter a repository path', 'error');
      return;
    }

    // Show loading state
    this.showStatus('Loading commits...', 'loading');
    this.elements.loadBtn.disabled = true;
    this.elements.loadBtn.textContent = 'Loading...';

    try {
      // Encode the path for URL
      const encodedPath = encodeURIComponent(repoPath);
      const response = await fetch(`/api/commits?repoPath=${encodedPath}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      // Store current data
      this.currentData = data;
      
      // Display results
      this.displayResults(data);
      this.initializeGraph();
      this.showStatus(`Successfully loaded ${data.data.commits.length} commits`, 'success');

    } catch (error) {
      console.error('Error loading commits:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
      this.hideResults();
    } finally {
      // Reset button state
      this.elements.loadBtn.disabled = false;
      this.elements.loadBtn.textContent = 'Load Commits';
    }
  }

  /**
   * Display analysis results
   */
  displayResults(data) {
    const { commits, stats } = data.data;
    
    // Show results section
    this.elements.resultsSection.style.display = 'block';
    
    // Display statistics
    this.displayStats(stats);
    
    // Display commits
    this.displayCommits(commits);
    
    // Update commits count
    this.elements.commitsCount.textContent = `${commits.length} commits`;
  }

  /**
   * Display repository statistics
   */
  displayStats(stats) {
    const statsHtml = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${stats.totalCommits}</div>
          <div class="stat-label">Total Commits</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.authors.length}</div>
          <div class="stat-label">Authors</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.mergeCommits}</div>
          <div class="stat-label">Merge Commits</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.formatDateRange(stats.dateRange)}</div>
          <div class="stat-label">Date Range</div>
        </div>
      </div>
      <div class="authors-list">
        <strong>Authors:</strong> ${stats.authors.join(', ')}
      </div>
    `;
    
    this.elements.statsContainer.innerHTML = statsHtml;
  }

  /**
   * Display commits list
   */
  displayCommits(commits) {
    if (this.showRaw) {
      this.displayRawCommits(commits);
    } else {
      this.displayFormattedCommits(commits);
    }
  }

  /**
   * Display formatted commits
   */
  displayFormattedCommits(commits) {
    const commitsHtml = commits.slice(0, 100).map(commit => `
      <div class="commit-item">
        <div class="commit-header">
          <div class="commit-hash">${commit.hash.substring(0, 8)}</div>
          <div class="commit-author">${this.escapeHtml(commit.author)}</div>
          <div class="commit-date">${this.formatDate(commit.date)}</div>
        </div>
        <div class="commit-message">${this.escapeHtml(commit.message)}</div>
        ${commit.parents.length > 1 ? '<div class="commit-badge">Merge</div>' : ''}
      </div>
    `).join('');

    const moreHtml = commits.length > 100 ? 
      `<div class="more-commits">... and ${commits.length - 100} more commits</div>` : '';

    this.elements.commitsContent.innerHTML = commitsHtml + moreHtml;
  }

  /**
   * Display raw JSON commits
   */
  displayRawCommits(commits) {
    const pre = document.createElement('pre');
    pre.className = 'raw-commits';
    pre.textContent = JSON.stringify(commits, null, 2);
    this.elements.commitsContent.innerHTML = '';
    this.elements.commitsContent.appendChild(pre);
  }

  /**
   * Toggle between formatted and raw view
   */
  toggleRawView() {
    this.showRaw = !this.showRaw;
    this.elements.toggleRaw.textContent = this.showRaw ? 'Show Formatted' : 'Show Raw';
    
    if (this.currentData) {
      this.displayCommits(this.currentData.data.commits);
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    this.elements.statusSection.style.display = 'block';
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.className = `status-message status-${type}`;
    
    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        this.hideStatus();
      }, 3000);
    }
  }

  /**
   * Hide status message
   */
  hideStatus() {
    this.elements.statusSection.style.display = 'none';
  }

  /**
   * Hide results section
   */
  hideResults() {
    this.elements.resultsSection.style.display = 'none';
  }

  /**
   * Format date range
   */
  formatDateRange(dateRange) {
    if (!dateRange) return 'N/A';
    return `${this.formatDate(dateRange.earliest)} - ${this.formatDate(dateRange.latest)}`;
  }

  /**
   * Format date string
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Initialize graph visualization
   */
  initializeGraph() {
    if (!this.currentData || !this.currentData.data.commits) return;

    // Load the graph script dynamically
    if (!this.graph) {
      const script = document.createElement('script');
      script.src = 'src/graph.js';
      script.onload = () => {
        const repoPath = this.elements.repoInput.value.trim();
        this.graph = new GitGraph('graphSvg', repoPath);
        this.graph.renderGraph(this.currentData.data.commits);
      };
      document.head.appendChild(script);
    } else {
      this.graph.renderGraph(this.currentData.data.commits);
    }
  }

  /**
   * Reset graph zoom
   */
  resetGraphZoom() {
    if (this.graph) {
      this.graph.resetZoom();
    }
  }

  /**
   * Toggle graph layout
   */
  toggleGraphLayout() {
    if (this.graph) {
      this.graph.toggleLayout();
    }
  }

  /**
   * Setup modal event handlers
   */
  setupModalHandlers() {
    const modal = document.getElementById('commitModal');
    const closeBtn = document.querySelector('.close');

    // Close modal when clicking the X
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Close modal with Escape key
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
      }
    });
  }

  /**
   * Filter commits by date range
   */
  filterByDate() {
    if (!this.originalCommits) {
      this.originalCommits = [...this.currentData.data.commits];
    }

    const percentage = parseInt(this.elements.dateSlider.value);
    
    if (percentage === 100) {
      // Show all commits
      this.currentData.data.commits = this.originalCommits;
      this.elements.dateRange.textContent = 'All commits';
    } else {
      // Filter commits based on percentage
      const totalCommits = this.originalCommits.length;
      const showCount = Math.ceil(totalCommits * (percentage / 100));
      
      // Get the most recent commits (assuming they're in chronological order)
      this.currentData.data.commits = this.originalCommits.slice(-showCount);
      
      const startDate = this.currentData.data.commits[0]?.date;
      const endDate = this.currentData.data.commits[this.currentData.data.commits.length - 1]?.date;
      
      if (startDate && endDate) {
        this.elements.dateRange.textContent = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      } else {
        this.elements.dateRange.textContent = `Latest ${showCount} commits`;
      }
    }

    // Re-render the graph with filtered data
    this.updateGraph();
  }

  /**
   * Hide commit info panel
   */
  hideCommitPanel() {
    this.elements.commitInfoPanel.style.display = 'none';
  }

  /**
   * Update graph with current data
   */
  updateGraph() {
    if (this.graph && this.currentData.data.commits.length > 0) {
      this.graph.renderGraph(this.currentData.data.commits);
    }
  }
}

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  new GitVisualizerApp();
});
