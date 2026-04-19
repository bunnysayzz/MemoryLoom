// Get current server URL dynamically
function getCurrentServerUrl() {
  return window.location.origin;
}

// Update all URL placeholders with current server URL
function updateServerUrls() {
  const serverUrl = getCurrentServerUrl();
  const elements = [
    'server-url',
    'claude-url', 
    'cursor-url',
    'vscode-url',
    'footer-url'
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = serverUrl;
    }
  });
}

// Copy text to clipboard
function copyToClipboard(elementId, button) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const text = element.textContent || element.innerText;
  navigator.clipboard.writeText(text).then(() => {
    // Show feedback
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.style.background = '#35d7bd';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

// Initialize copy button event listeners
function initializeCopyButtons() {
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const targetId = e.target.getAttribute('data-target');
      copyToClipboard(targetId, e.target);
    });
  });
}

// Tab functionality
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const targetContent = document.getElementById(`${targetTab}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Fetch setup info including API key
async function fetchSetupInfo() {
  const serverUrl = getCurrentServerUrl();
  try {
    const response = await fetch(`${serverUrl}/api/setup-info`);
    const data = await response.json();
    if (data.ok) {
      return data;
    }
  } catch (error) {
    console.error('Failed to fetch setup info:', error);
  }
  return null;
}

// Display API key in UI
async function displayApiKey() {
  const setupInfo = await fetchSetupInfo();
  if (setupInfo && setupInfo.apiKey) {
    const apiKeyElement = document.getElementById('api-key-display');
    const apiKeyValue = document.getElementById('api-key-value');
    if (apiKeyValue) {
      apiKeyValue.textContent = setupInfo.apiKey;
      apiKeyValue.style.display = 'block';
    }
    if (apiKeyElement) {
      apiKeyElement.style.display = 'block';
    }
  }
}

// Download config file
function downloadConfig(editor) {
  const serverUrl = getCurrentServerUrl();
  const apiKey = document.getElementById('api-key-value')?.textContent || '';
  
  let config;
  let filename;
  
  switch(editor) {
    case 'claude':
      config = {
        "mcpServers": {
          "memoryloom": {
            "command": "node",
            "args": ["/absolute/path/to/memoryloom/server.js"],
            "env": {
              "MEMORYLOOM_API_KEY": apiKey
            }
          }
        }
      };
      filename = 'claude_desktop_config.json';
      break;
    case 'cursor':
      config = {
        "context_servers": {
          "memoryloom": {
            "command": "node",
            "args": ["/absolute/path/to/memoryloom/server.js"],
            "env": {
              "MEMORYLOOM_API_KEY": apiKey
            }
          }
        }
      };
      filename = 'cursor_config.json';
      break;
    case 'vscode':
      config = {
        "github.copilot.mcp.servers": {
          "memoryloom": {
            "command": "node",
            "args": ["/absolute/path/to/memoryloom/server.js"],
            "env": {
              "MEMORYLOOM_API_KEY": apiKey
            }
          }
        }
      };
      filename = 'vscode_settings.json';
      break;
  }
  
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Health check functionality
async function checkServerHealth() {
  const serverUrl = getCurrentServerUrl();
  const setupInfo = await fetchSetupInfo();

  try {
    // Use setup info for health check with auth if API key exists
    const headers = {};
    if (setupInfo && setupInfo.apiKey) {
      headers['X-API-Key'] = setupInfo.apiKey;
    }
    
    const healthResponse = await fetch(`${serverUrl}/health`, { headers });
    const healthData = await healthResponse.json();

    if (healthData.ok) {
      updateHealthStatus('server-status', '✅ Online', 'healthy');
      updateHealthStatus('storage-mode', healthData.storage?.mode || 'JSON', 'healthy');

      // Try to get memory count from storage status
      const memoryCount = healthData.storage?.count || 0;
      updateHealthStatus('memory-count', `${memoryCount} memories`, 'healthy');
    } else {
      updateHealthStatus('server-status', '⚠️ Issues', 'warning');
    }
  } catch (error) {
    updateHealthStatus('server-status', '❌ Offline', 'error');
    updateHealthStatus('memory-count', 'N/A', 'error');
    updateHealthStatus('storage-mode', 'N/A', 'error');
  }
}

function updateHealthStatus(elementId, text, status) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<span class="status-${status}">${text}</span>`;
  }
}

// Smooth scrolling for navigation links
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Reveal animation
function initializeRevealAnimation() {
  const revealTargets = Array.from(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );

    for (const element of revealTargets) {
      observer.observe(element);
    }
  } else {
    for (const element of revealTargets) {
      element.classList.add("in");
    }
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  updateServerUrls();
  displayApiKey();
  initializeCopyButtons();
  initializeTabs();
  initializeSmoothScrolling();
  initializeRevealAnimation();
  checkServerHealth();
  
  // Initialize copy API key button
  document.getElementById('copy-api-key')?.addEventListener('click', function() {
    const apiKey = document.getElementById('api-key-value').textContent;
    navigator.clipboard.writeText(apiKey).then(() => {
      this.textContent = 'Copied!';
      setTimeout(() => {
        this.textContent = 'Copy';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy API key:', err);
    });
  });
  
  // Initialize download buttons
  document.getElementById('download-claude')?.addEventListener('click', () => downloadConfig('claude'));
  document.getElementById('download-cursor')?.addEventListener('click', () => downloadConfig('cursor'));
  document.getElementById('download-vscode')?.addEventListener('click', () => downloadConfig('vscode'));
});
