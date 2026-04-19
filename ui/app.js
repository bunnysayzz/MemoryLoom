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

  let text = element.textContent || element.innerText;
  
  // Replace placeholders with actual values
  const apiKeyElement = document.getElementById('api-key-value');
  if (apiKeyElement && apiKeyElement.textContent) {
    text = text.replace('${MEMORYLOOM_API_KEY}', apiKeyElement.textContent);
  }
  
  // Replace MCP URL placeholder if it still exists
  // (it should already be replaced by displayApiKey, but just in case)
  fetchSetupInfo().then(setupInfo => {
    if (setupInfo && setupInfo.mcpUrl && text.includes('${MCP_URL}')) {
      text = text.replace('${MCP_URL}', setupInfo.mcpUrl);
    }
    
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
    const apiKeyElement = document.getElementById('api-key-value');
    if (apiKeyElement) {
      apiKeyElement.textContent = setupInfo.apiKey;
      apiKeyElement.style.display = 'block';
    }
    if (apiKeyElement) {
      apiKeyElement.style.display = 'block';
    }
    
    // Replace placeholders in all config snippets with actual values
    const configElements = document.querySelectorAll('pre[id$="-config"], pre[id="local-setup"]');
    console.log('Found config elements:', configElements.length);
    configElements.forEach(element => {
      let updatedText = element.textContent;
      
      // Replace MCP URL placeholder
      if (setupInfo.mcpUrl && updatedText.includes('${MCP_URL}')) {
        updatedText = updatedText.replace('${MCP_URL}', setupInfo.mcpUrl);
        console.log('Replaced MCP_URL in:', element.id);
      }
      
      // Replace API key placeholder
      if (updatedText.includes('${MEMORYLOOM_API_KEY}')) {
        updatedText = updatedText.replace('${MEMORYLOOM_API_KEY}', setupInfo.apiKey);
        console.log('Replaced API_KEY in:', element.id);
      }
      
      element.textContent = updatedText;
    });
  } else {
    console.log('No setup info or API key available');
  }
}

// Regenerate API key
async function regenerateApiKey() {
  const serverUrl = getCurrentServerUrl();
  try {
    const response = await fetch(`${serverUrl}/api/regenerate-api-key`, {
      method: 'POST'
    });
    const data = await response.json();
    if (data.ok) {
      // Update the displayed API key
      const apiKeyValue = document.getElementById('api-key-value');
      if (apiKeyValue) {
        apiKeyValue.textContent = data.apiKey;
      }
      
      // Update all config snippets with new API key
      const configElements = document.querySelectorAll('pre[id$="-config"]');
      configElements.forEach(element => {
        // Replace any existing API key with the new one
        const currentContent = element.textContent;
        // First replace the placeholder if it exists
        if (currentContent.includes('${MEMORYLOOM_API_KEY}')) {
          element.textContent = currentContent.replace('${MEMORYLOOM_API_KEY}', data.apiKey);
        } else {
          // Replace any existing API key value (looks for the pattern in the config)
          element.textContent = currentContent.replace(/"Authorization":\s*"Bearer [^"]+"/, `"Authorization": "Bearer ${data.apiKey}"`);
        }
      });
      
      return data.apiKey;
    } else {
      throw new Error(data.error || 'Failed to regenerate API key');
    }
  } catch (error) {
    console.error('Failed to regenerate API key:', error);
    alert('Failed to regenerate API key. Please try again.');
  }
}

// Download config file
function downloadConfig(editor) {
  const serverUrl = getCurrentServerUrl();
  
  let config;
  let filename;
  
  switch(editor) {
    case 'claude':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
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
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
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
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'vscode_settings.json';
      break;
    case 'windsurf':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'windsurf_config.json';
      break;
    case 'zed':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'zed_config.json';
      break;
    case 'continue':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'continue_config.json';
      break;
    case 'aider':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'aider_config.json';
      break;
    case 'jetbrains':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'jetbrains_config.json';
      break;
    case 'codeium':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'codeium_config.json';
      break;
    case 'tabby':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'tabby_config.json';
      break;
    case 'replit':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'replit_config.json';
      break;
    case 'cline':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'cline_config.json';
      break;
    case 'roocode':
      config = {
        "mcpServers": {
          "memoryloom": {
            "url": "${MCP_URL}",
            "headers": {
              "Authorization": "Bearer ${MEMORYLOOM_API_KEY}"
            }
          }
        }
      };
      filename = 'roocode_config.json';
      break;
  }
  
  // Replace placeholders with actual values
  const apiKeyElement = document.getElementById('api-key-value');
  if (apiKeyElement && apiKeyElement.textContent) {
    const configString = JSON.stringify(config, null, 2);
    let configWithValues = configString.replace('${MEMORYLOOM_API_KEY}', apiKeyElement.textContent);
    
    // Replace MCP URL placeholder
    fetchSetupInfo().then(setupInfo => {
      if (setupInfo && setupInfo.mcpUrl) {
        configWithValues = configWithValues.replace('${MCP_URL}', setupInfo.mcpUrl);
      }
      
      const blob = new Blob([configWithValues], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  } else {
    // Fallback to original behavior if no API key available
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
document.addEventListener('DOMContentLoaded', async () => {
  await displayApiKey();
  checkServerHealth();
  
  // Settings modal functionality
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const settingsCopyApiKey = document.getElementById('settings-copy-api-key');
  const settingsRegenerateApiKey = document.getElementById('settings-regenerate-api-key');
  const settingsApiKey = document.getElementById('settings-api-key');
  
  // Open settings modal
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      const apiKeyValue = document.getElementById('api-key-value');
      if (apiKeyValue && apiKeyValue.textContent) {
        settingsApiKey.textContent = apiKeyValue.textContent;
      }
      settingsModal.style.display = 'flex';
    });
  }
  
  // Close settings modal
  if (closeSettings) {
    closeSettings.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
      }
    });
  }
  
  // Copy API key from settings
  if (settingsCopyApiKey) {
    settingsCopyApiKey.addEventListener('click', () => {
      if (settingsApiKey.textContent) {
        navigator.clipboard.writeText(settingsApiKey.textContent).then(() => {
          const originalText = settingsCopyApiKey.textContent;
          settingsCopyApiKey.textContent = 'Copied!';
          setTimeout(() => {
            settingsCopyApiKey.textContent = originalText;
          }, 2000);
        });
      }
    });
  }
  
  // Regenerate API key from settings
  if (settingsRegenerateApiKey) {
    settingsRegenerateApiKey.addEventListener('click', async () => {
      const newApiKey = await regenerateApiKey();
      if (newApiKey) {
        settingsApiKey.textContent = newApiKey;
        // Update all config snippets with new key
        const configElements = document.querySelectorAll('pre[id$="-config"]');
        configElements.forEach(element => {
          const currentContent = element.textContent;
          element.textContent = currentContent.replace(/"Authorization":\s*"Bearer [^"]+"/, `"Authorization": "Bearer ${newApiKey}"`);
        });
      }
    });
  }
  
  initializeCopyButtons();
  initializeTabs();
  initializeSmoothScrolling();
  initializeRevealAnimation();
  
  // Initialize download buttons
  document.getElementById('download-claude')?.addEventListener('click', () => downloadConfig('claude'));
  document.getElementById('download-cursor')?.addEventListener('click', () => downloadConfig('cursor'));
  document.getElementById('download-vscode')?.addEventListener('click', () => downloadConfig('vscode'));
  document.getElementById('download-windsurf')?.addEventListener('click', () => downloadConfig('windsurf'));
  document.getElementById('download-zed')?.addEventListener('click', () => downloadConfig('zed'));
  document.getElementById('download-continue')?.addEventListener('click', () => downloadConfig('continue'));
  document.getElementById('download-aider')?.addEventListener('click', () => downloadConfig('aider'));
  document.getElementById('download-jetbrains')?.addEventListener('click', () => downloadConfig('jetbrains'));
  document.getElementById('download-codeium')?.addEventListener('click', () => downloadConfig('codeium'));
  document.getElementById('download-tabby')?.addEventListener('click', () => downloadConfig('tabby'));
  document.getElementById('download-replit')?.addEventListener('click', () => downloadConfig('replit'));
  document.getElementById('download-cline')?.addEventListener('click', () => downloadConfig('cline'));
  document.getElementById('download-roocode')?.addEventListener('click', () => downloadConfig('roocode'));
});
