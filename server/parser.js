/**
 * Git Log Parser - Converts raw Git log output into structured JSON
 */

/**
 * Parse raw Git log output into structured commit data
 * @param {string} rawOutput - Raw Git log output
 * @param {Object} branchInfo - Branch information mapping
 * @returns {Array} Array of commit objects
 */
function parseGitLog(rawOutput, branchInfo = {}) {
  if (!rawOutput || typeof rawOutput !== 'string') {
    return [];
  }

  // Split by lines and filter out empty lines
  const lines = rawOutput.split('\n').filter(line => line.trim());
  
  const commits = [];
  
  for (const line of lines) {
    try {
      const commit = parseCommitLine(line);
      if (commit) {
        // Add branch information
        commit.branches = branchInfo[commit.hash] || [];
        commits.push(commit);
      }
    } catch (error) {
      console.warn('Failed to parse commit line:', line, error.message);
      // Continue processing other lines even if one fails
    }
  }
  
  return commits;
}

/**
 * Parse a single commit line
 * @param {string} line - Single commit line from Git log
 * @returns {Object} Parsed commit object
 */
function parseCommitLine(line) {
  // Expected format: "hash|parent1,parent2|author|date|message"
  const parts = line.split('|');
  
  if (parts.length < 5) {
    throw new Error('Invalid commit format - expected at least 5 parts separated by |');
  }
  
  const [hash, parentsStr, author, date, ...messageParts] = parts;
  const message = messageParts.join('|'); // Rejoin message parts in case they contain |
  
  // Validate required fields
  if (!hash || !author || !date) {
    throw new Error('Missing required commit fields');
  }
  
  // Parse parents (can be empty for initial commits, or multiple for merge commits)
  let parents = [];
  if (parentsStr && parentsStr.trim()) {
    parents = parentsStr.split(' ').filter(p => p.trim());
  }
  
  return {
    hash: hash.trim(),
    parents: parents,
    author: author.trim(),
    date: date.trim(),
    message: message.trim()
  };
}

/**
 * Validate parsed commit data
 * @param {Array} commits - Array of commit objects
 * @returns {Object} Validation result with errors array
 */
function validateCommits(commits) {
  const errors = [];
  
  if (!Array.isArray(commits)) {
    errors.push('Commits data is not an array');
    return { isValid: false, errors };
  }
  
  commits.forEach((commit, index) => {
    if (!commit || typeof commit !== 'object') {
      errors.push(`Commit at index ${index} is not an object`);
      return;
    }
    
    // Check required fields
    const requiredFields = ['hash', 'author', 'date', 'message'];
    for (const field of requiredFields) {
      if (!commit[field] || typeof commit[field] !== 'string') {
        errors.push(`Commit at index ${index} missing or invalid ${field} field`);
      }
    }
    
    // Validate parents array
    if (!Array.isArray(commit.parents)) {
      errors.push(`Commit at index ${index} parents field is not an array`);
    }
    
    // Validate hash format (should be 40 character hex string, but we'll be flexible)
    if (commit.hash && !/^[a-f0-9]+$/i.test(commit.hash)) {
      errors.push(`Commit at index ${index} has invalid hash format`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get statistics about the parsed commits
 * @param {Array} commits - Array of commit objects
 * @returns {Object} Statistics object
 */
function getCommitStats(commits) {
  if (!Array.isArray(commits) || commits.length === 0) {
    return {
      totalCommits: 0,
      authors: [],
      dateRange: null,
      mergeCommits: 0
    };
  }
  
  const authors = new Set();
  let mergeCommits = 0;
  let earliestDate = commits[0].date;
  let latestDate = commits[0].date;
  
  commits.forEach(commit => {
    authors.add(commit.author);
    
    if (commit.parents && commit.parents.length > 1) {
      mergeCommits++;
    }
    
    // Track date range
    if (commit.date < earliestDate) {
      earliestDate = commit.date;
    }
    if (commit.date > latestDate) {
      latestDate = commit.date;
    }
  });
  
  return {
    totalCommits: commits.length,
    authors: Array.from(authors),
    dateRange: {
      earliest: earliestDate,
      latest: latestDate
    },
    mergeCommits
  };
}

module.exports = {
  parseGitLog,
  parseCommitLine,
  validateCommits,
  getCommitStats
};
