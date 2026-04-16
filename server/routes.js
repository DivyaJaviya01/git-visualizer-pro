const express = require('express');
const GitService = require('./gitService');
const { parseGitLog, validateCommits, getCommitStats } = require('./parser');

const router = express.Router();

/**
 * GET /api/commits
 * Get commits from a Git repository
 * Query parameters:
 * - repoPath: Path to the Git repository (required)
 */
router.get('/commits', async (req, res) => {
  try {
    const { repoPath } = req.query;
    
    // Validate repository path parameter
    if (!repoPath) {
      return res.status(400).json({
        error: 'Repository path is required',
        code: 'MISSING_REPO_PATH'
      });
    }
    
    // Sanitize and validate repoPath
    const sanitizedPath = repoPath.trim();
    if (!sanitizedPath) {
      return res.status(400).json({
        error: 'Repository path cannot be empty',
        code: 'EMPTY_REPO_PATH'
      });
    }
    
    // Check if Git is available
    const gitAvailable = await GitService.isGitAvailable();
    if (!gitAvailable) {
      return res.status(500).json({
        error: 'Git is not installed or not available in PATH',
        code: 'GIT_NOT_AVAILABLE'
      });
    }
    
    // Get raw Git log and branch information
    const [rawLog, branchInfo] = await Promise.all([
      GitService.getGitLog(sanitizedPath),
      GitService.getBranchInfo(sanitizedPath)
    ]);
    
    // Parse the log into structured data
    const commits = parseGitLog(rawLog, branchInfo);
    
    // Validate parsed commits
    const validation = validateCommits(commits);
    if (!validation.isValid) {
      console.warn('Commit validation warnings:', validation.errors);
      // Continue even with validation warnings, but log them
    }
    
    // Get statistics
    const stats = getCommitStats(commits);
    
    // Return success response
    res.json({
      success: true,
      data: {
        commits,
        stats,
        repositoryPath: sanitizedPath
      },
      meta: {
        totalCommits: commits.length,
        processedAt: new Date().toISOString(),
        validationWarnings: validation.errors.length > 0 ? validation.errors : undefined
      }
    });
    
  } catch (error) {
    console.error('Error in /api/commits:', error);
    
    // Handle specific error types
    if (error.message.includes('does not exist')) {
      return res.status(404).json({
        error: 'Repository path does not exist',
        code: 'REPO_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Not a Git repository')) {
      return res.status(400).json({
        error: 'Not a valid Git repository',
        code: 'INVALID_REPO'
      });
    }
    
    if (error.message.includes('empty or corrupted')) {
      return res.status(400).json({
        error: 'Repository appears to be empty or corrupted',
        code: 'EMPTY_REPO'
      });
    }
    
    if (error.message.includes('Git execution failed')) {
      return res.status(500).json({
        error: 'Failed to execute Git commands',
        code: 'GIT_EXECUTION_ERROR'
      });
    }
    
    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/commit/:hash
 * Get detailed information for a specific commit
 * Query parameters:
 * - repoPath: Path to the Git repository (required)
 */
router.get('/commit/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { repoPath } = req.query;
    
    if (!repoPath) {
      return res.status(400).json({
        error: 'Repository path is required',
        code: 'MISSING_REPO_PATH'
      });
    }
    
    if (!hash) {
      return res.status(400).json({
        error: 'Commit hash is required',
        code: 'MISSING_COMMIT_HASH'
      });
    }
    
    const details = await GitService.getCommitDetails(repoPath.trim(), hash);
    
    res.json({
      success: true,
      data: details
    });
    
  } catch (error) {
    console.error('Error getting commit details:', error);
    
    if (error.message.includes('Failed to get commit details')) {
      return res.status(404).json({
        error: 'Commit not found',
        code: 'COMMIT_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const gitAvailable = await GitService.isGitAvailable();
    
    res.json({
      success: true,
      status: 'healthy',
      gitAvailable,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Error handling middleware for routes
 */
router.use((error, req, res, next) => {
  console.error('Route error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'ROUTE_ERROR'
  });
});

module.exports = router;
