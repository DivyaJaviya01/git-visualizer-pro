const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Git Service - Executes Git commands and returns raw output
 */
class GitService {
  /**
   * Get Git log from repository path
   * @param {string} repoPath - Path to Git repository
   * @returns {Promise<string>} Raw Git log output
   */
  static async getGitLog(repoPath) {
    return new Promise((resolve, reject) => {
      // Validate repository path
      if (!repoPath || typeof repoPath !== 'string') {
        return reject(new Error('Invalid repository path provided'));
      }

      // Check if path exists
      if (!fs.existsSync(repoPath)) {
        return reject(new Error('Repository path does not exist'));
      }

      // Check if it's a Git repository
      const gitDir = path.join(repoPath, '.git');
      if (!fs.existsSync(gitDir)) {
        return reject(new Error('Not a Git repository (no .git directory found)'));
      }

      // Execute Git log command
      const command = `git -C "${repoPath}" log --all --pretty=format:"%H|%P|%an|%ad|%s" --date=iso`;
      
      exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          // Handle Git command errors
          if (error.code === 128) {
            return reject(new Error('Git command failed - repository may be empty or corrupted'));
          }
          return reject(new Error(`Git execution failed: ${error.message}`));
        }

        if (stderr) {
          // Git warnings on stderr are usually fine, but log them
          console.warn('Git command stderr:', stderr);
        }

        // Return empty string if no commits
        if (!stdout.trim()) {
          return resolve('');
        }

        resolve(stdout);
      });
    });
  }

  /**
   * Get branch information for commits
   * @param {string} repoPath - Path to Git repository
   * @returns {Promise<Object>} Branch information mapping
   */
  static async getBranchInfo(repoPath) {
    return new Promise((resolve, reject) => {
      // Get all branches and their commit hashes
      const command = `git -C "${repoPath}" branch -a --format="%(refname:short)|%(objectname)"`;
      
      exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.warn('Failed to get branch info:', error.message);
          return resolve({}); // Return empty object if branch command fails
        }

        const branchMap = {};
        const lines = stdout.trim().split('\n');
        
        lines.forEach(line => {
          const [branch, commit] = line.split('|');
          if (branch && commit) {
            if (!branchMap[commit]) {
              branchMap[commit] = [];
            }
            branchMap[commit].push(branch.trim());
          }
        });

        resolve(branchMap);
      });
    });
  }

  /**
   * Get commit details including file changes
   * @param {string} repoPath - Path to Git repository
   * @param {string} commitHash - Commit hash
   * @returns {Promise<Object>} Detailed commit information
   */
  static async getCommitDetails(repoPath, commitHash) {
    return new Promise((resolve, reject) => {
      // Get commit details and file changes
      const command = `git -C "${repoPath}" show --stat --format="fuller" ${commitHash}`;
      
      exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`Failed to get commit details: ${error.message}`));
        }

        resolve({
          hash: commitHash,
          details: stdout.trim()
        });
      });
    });
  }

  /**
   * Check if Git is installed and available
   * @returns {Promise<boolean>} True if Git is available
   */
  static async isGitAvailable() {
    return new Promise((resolve) => {
      exec('git --version', (error) => {
        resolve(!error);
      });
    });
  }
}

module.exports = GitService;
