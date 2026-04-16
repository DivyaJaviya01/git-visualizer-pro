/**
 * Git Graph Visualization using D3.js
 */

class GitGraph {
  constructor(containerId, repoPath) {
    this.containerId = containerId;
    this.repoPath = repoPath;
    this.svg = null;
    this.g = null;
    this.zoom = null;
    this.simulation = null;
    this.currentLayout = 'force';
    this.nodes = [];
    this.links = [];
    
    // Graph dimensions
    this.width = 800;
    this.height = 600;
    
    this.initializeGraph();
  }

  /**
   * Initialize the D3.js graph container
   */
  initializeGraph() {
    // Clear any existing content
    d3.select(`#${this.containerId}`).selectAll("*").remove();
    
    // Create SVG
    this.svg = d3.select(`#${this.containerId}`)
      .attr('viewBox', [0, 0, this.width, this.height])
      .style('width', '100%')
      .style('height', '100%');

    // Create main group for transformations
    this.g = this.svg.append('g');

    // Setup zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Create arrow markers for links
    this.svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');
  }

  /**
   * Convert Git commits to D3.js graph data
   */
  convertCommitsToGraph(commits) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Create nodes
    commits.forEach((commit, index) => {
      const node = {
        id: commit.hash,
        hash: commit.hash,
        author: commit.author,
        date: commit.date,
        message: commit.message,
        parents: commit.parents,
        branches: commit.branches || [],
        isMerge: commit.parents.length > 1,
        index: index
      };
      
      nodes.push(node);
      nodeMap.set(commit.hash, node);
    });

    // Create links (parent -> child relationships)
    commits.forEach(commit => {
      commit.parents.forEach(parentHash => {
        const parentNode = nodeMap.get(parentHash);
        const childNode = nodeMap.get(commit.hash);
        
        if (parentNode && childNode) {
          links.push({
            source: parentNode,
            target: childNode,
            type: 'parent'
          });
        }
      });
    });

    return { nodes, links };
  }

  /**
   * Render the graph with commit data
   */
  renderGraph(commits) {
    if (!commits || commits.length === 0) {
      this.showEmptyState();
      return;
    }

    const graphData = this.convertCommitsToGraph(commits);
    this.nodes = graphData.nodes;
    this.links = graphData.links;

    // Clear previous graph
    this.g.selectAll('*').remove();

    if (this.currentLayout === 'force') {
      this.renderForceLayout();
    } else {
      this.renderTreeLayout();
    }
  }

  /**
   * Render force-directed layout
   */
  renderForceLayout() {
    // Create force simulation
    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = this.g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.links)
      .enter().append('line')
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#end)');

    // Create nodes
    const node = this.g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(this.nodes)
      .enter().append('g')
      .call(this.createDragBehavior());

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => d.isMerge ? 12 : 8)
      .attr('fill', d => this.getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add branch/commit labels
    node.append('text')
      .attr('x', 0)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '11px')
      .attr('fill', '#4a9eff')
      .attr('font-weight', 'bold')
      .text(d => this.getNodeLabel(d));

    // Click handling is now integrated in drag behavior

    // Add tooltips
    node.append('title')
      .text(d => `${d.hash.substring(0, 8)}\n${d.author}\n${d.message}\n${d.date}`);

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }

  /**
   * Render tree layout
   */
  renderTreeLayout() {
    // Create hierarchical layout with increased spacing
    const root = this.createHierarchy();
    const treeLayout = d3.tree()
      .size([this.width, this.height + 1000])
      .separation((a, b) => {
        // Increase separation for better readability
        return (a.parent == b.parent ? 1.5 : 2) / (a.depth == 0 ? 2 : 1);
      });

    treeLayout(root);

    // Create links
    const link = this.g.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(root.links())
      .enter().append('path')
      .attr('d', d3.linkVertical()
        .x(d => d.x + 100)
        .y(d => d.y + 75))
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 2);

    // Create nodes
    const node = this.g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(root.descendants())
      .enter().append('g')
      .attr('transform', d => `translate(${d.x + 100},${d.y + 75})`);

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => d.data.isMerge ? 12 : 8)
      .attr('fill', d => this.getNodeColor(d.data))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add branch/commit labels
    node.append('text')
      .attr('x', 0)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '11px')
      .attr('fill', '#4a9eff')
      .attr('font-weight', 'bold')
      .text(d => this.getNodeLabel(d.data));

    // Tree layout nodes don't have drag behavior, so we need a click handler here
    node.on('click', (event, d) => {
      console.log('Tree node clicked:', d);
      console.log('Tree node data:', d.data);
      this.showCommitDetails(d.data);
      event.stopPropagation();
    });

    // Add tooltips
    node.append('title')
      .text(d => `${d.data.hash.substring(0, 8)}\n${d.data.author}\n${d.data.message}\n${d.data.date}`);
  }

  /**
   * Create hierarchical data structure for tree layout
   */
  createHierarchy() {
    const nodeMap = new Map();
    
    // Create node objects
    this.nodes.forEach(node => {
      nodeMap.set(node.id, { 
        ...node, 
        children: [],
        branches: node.branches || [],
        isMerge: node.isMerge || false
      });
    });

    // Build hierarchy
    const roots = [];
    nodeMap.forEach(node => {
      if (node.parents.length === 0) {
        roots.push(node);
      } else {
        node.parents.forEach(parentId => {
          const parent = nodeMap.get(parentId);
          if (parent) {
            parent.children.push(node);
          }
        });
      }
    });

    // Return first root (for simplicity)
    return d3.hierarchy(roots[0] || this.nodes[0]);
  }

  /**
   * Get node color based on properties
   */
  getNodeColor(node) {
    // Priority: Merge commits > Main branches > Feature branches > Author-based
    
    if (node.isMerge) {
      return '#ff6b6b'; // Red for merge commits
    }
    
    // Check for main/master branches
    if (node.branches && node.branches.length > 0) {
      const mainBranches = ['main', 'master', 'develop', 'dev'];
      for (const branch of node.branches) {
        const branchName = branch.replace('remotes/origin/', '');
        if (mainBranches.includes(branchName)) {
          return '#4a9eff'; // Blue for main branches
        }
      }
      
      // Color by branch name for other branches
      const branchHash = node.branches[0].split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const branchColors = ['#51cf66', '#ffd43b', '#ff8cc3', '#845ef7', '#20c997', '#fd7e14'];
      return branchColors[branchHash % branchColors.length];
    }
    
    // Fallback: Color by author (simple hash-based coloring)
    const authorHash = node.author.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['#4a9eff', '#51cf66', '#ff6b6b', '#ffd43b', '#ff8cc3', '#845ef7'];
    return colors[authorHash % colors.length];
  }

  /**
   * Create drag behavior for nodes
   */
  createDragBehavior() {
    let isDragging = false;
    let dragStartTime = 0;
    let clickTimeout = null;
    
    return d3.drag()
      .on('start', (event, d) => {
        isDragging = false;
        dragStartTime = Date.now();
        
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        
        // Clear any existing click timeout
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
        }
      })
      .on('drag', (event, d) => {
        isDragging = true;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        
        const dragEndTime = Date.now();
        const dragDuration = dragEndTime - dragStartTime;
        
        // If drag was very short (< 200ms) and no significant movement, treat as click
        if (!isDragging && dragDuration < 200) {
          clickTimeout = setTimeout(() => {
            this.showCommitDetails(d);
          }, 10);
        } else {
          // Reset fixed positions after drag
          d.fx = null;
          d.fy = null;
        }
        
        isDragging = false;
      });
  }

  /**
   * Show empty state when no data
   */
  showEmptyState() {
    this.g.append('text')
      .attr('x', this.width / 2)
      .attr('y', this.height / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', '#888')
      .text('No commits to visualize');
  }

  /**
   * Reset zoom to default
   */
  resetZoom() {
    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  /**
   * Toggle between force and tree layout
   */
  toggleLayout() {
    this.currentLayout = this.currentLayout === 'force' ? 'tree' : 'force';
    
    // Stop simulation if running
    if (this.simulation) {
      this.simulation.stop();
    }
    
    // Re-render with new layout
    if (this.nodes.length > 0) {
      this.renderGraph(this.nodes.map(n => ({
        hash: n.hash,
        author: n.author,
        date: n.date,
        message: n.message,
        parents: n.parents,
        branches: n.branches || [],
        isMerge: n.isMerge || false
      })));
    }
  }

  /**
   * Get appropriate node label (branch name or commit message)
   */
  getNodeLabel(node) {
    if (node.branches && node.branches.length > 0) {
      // Show branch name if available
      const branchName = node.branches[0].replace('remotes/origin/', '');
      return branchName.length > 15 ? branchName.substring(0, 15) + '...' : branchName;
    }
    
    // Show short commit message if no branches
    const message = node.message;
    return message.length > 20 ? message.substring(0, 20) + '...' : message;
  }

  /**
   * Show commit details panel
   */
  async showCommitDetails(node) {
    console.log('showCommitDetails called with node:', node);
    
    try {
      // Show panel immediately with basic info
      this.displayCommitPanel(node);
      
      // Fetch detailed commit information in background
      const url = `/api/commit/${node.hash}?repoPath=${encodeURIComponent(this.repoPath)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        // Update panel with detailed info if available
        this.updateCommitPanel(node, data.data);
      }
    } catch (error) {
      console.error('Error fetching commit details:', error);
    }
  }

  /**
   * Display commit info panel
   */
  displayCommitPanel(node) {
    const panel = document.getElementById('commitInfoPanel');
    const panelHash = document.getElementById('panelHash');
    const panelAuthor = document.getElementById('panelAuthor');
    const panelDate = document.getElementById('panelDate');
    const panelBranches = document.getElementById('panelBranches');
    const panelMessage = document.getElementById('panelMessage');

    // Populate panel with basic commit information
    panelHash.textContent = node.hash;
    panelAuthor.textContent = node.author;
    panelDate.textContent = new Date(node.date).toLocaleString();
    panelBranches.textContent = node.branches.length > 0 ? node.branches.join(', ') : 'No branches';
    panelMessage.textContent = node.message;

    // Show panel
    panel.style.display = 'block';
  }

  /**
   * Update commit panel with detailed info
   */
  updateCommitPanel(node, details) {
    // Panel already shows basic info, could add more details here if needed
    console.log('Panel updated with detailed info:', details);
  }

  /**
   * Update graph dimensions
   */
  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.svg.attr('viewBox', [0, 0, this.width, this.height]);
  }
}
