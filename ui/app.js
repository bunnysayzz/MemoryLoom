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
    'vscode-url'
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
    case 'local':
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
      filename = 'http_mcp_config.json';
      break;
    case 'gemini-vscode':
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
      filename = 'gemini_vscode_config.json';
      break;
    case 'claude-cli':
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
      filename = 'claude_cli_config.json';
      break;
    case 'gemini-cli':
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
      filename = 'gemini_cli_config.json';
      break;
    case 'kiro':
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
      filename = 'kiro_config.json';
      break;
    case 'antigravity':
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
      filename = 'antigravity_config.json';
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
      updateHealthStatus('server-status', 'Online', 'healthy');
      
      // Update memory stats
      await loadMemoryStats();
    } else {
      updateHealthStatus('server-status', 'Issues Detected', 'warning');
    }
  } catch (error) {
    updateHealthStatus('server-status', 'Offline', 'error');
  }
}

// Memory Management Functions
async function callMcpTool(toolName, args = {}) {
  const serverUrl = getCurrentServerUrl();
  const setupInfo = await fetchSetupInfo();
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (setupInfo && setupInfo.apiKey) {
    headers['Authorization'] = `Bearer ${setupInfo.apiKey}`;
  }
  
  const response = await fetch(`${serverUrl}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    })
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'MCP tool call failed');
  }
  
  // Extract text content from MCP response
  if (data.result && data.result.content && data.result.content[0]) {
    return JSON.parse(data.result.content[0].text);
  }
  
  return data.result;
}

async function loadMemoryStats() {
  try {
    const stats = await callMcpTool('memory_stats');
    
    if (stats.ok && stats.stats) {
      document.getElementById('total-memories').textContent = stats.stats.total || 0;
      document.getElementById('active-memories').textContent = stats.stats.active || 0;
      document.getElementById('archived-memories').textContent = stats.stats.archived || 0;
    }
    
    // Get storage mode from server status
    const status = await callMcpTool('server_status');
    if (status.ok && status.status) {
      const storageMode = status.status.storage?.mode || 'JSON';
      document.getElementById('storage-mode-display').textContent = storageMode.toUpperCase();
    }
  } catch (error) {
    console.error('Failed to load memory stats:', error);
  }
}

async function loadMemories(filters = {}) {
  const memoryList = document.getElementById('memory-list');
  
  // Show loading state
  memoryList.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading memories...</p>
    </div>
  `;
  
  try {
    const result = await callMcpTool('list_memories', {
      limit: 100,
      sort: 'updated_desc',
      filters
    });
    
    if (result.ok && result.memories && result.memories.length > 0) {
      memoryList.innerHTML = result.memories.map(memory => renderMemoryCard(memory)).join('');
      
      // Attach event listeners to edit and delete buttons
      document.querySelectorAll('.edit-memory-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditMemoryModal(btn.dataset.id));
      });
      
      document.querySelectorAll('.delete-memory-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteMemoryModal(btn.dataset.id));
      });
    } else {
      memoryList.innerHTML = `
        <div class="empty-state">
          <p>No memories found. Add your first memory to get started!</p>
        </div>
      `;
    }
    
    // Update filter dropdowns
    await updateFilterDropdowns();
  } catch (error) {
    console.error('Failed to load memories:', error);
    memoryList.innerHTML = `
      <div class="empty-state">
        <p>Failed to load memories: ${error.message}</p>
      </div>
    `;
  }
}

function renderMemoryCard(memory) {
  const importance = (memory.importance * 100).toFixed(0);
  const confidence = ((memory.metadata?.confidence || 1) * 100).toFixed(0);
  const tags = memory.metadata?.tags || [];
  const archived = memory.metadata?.archived || false;
  
  const tagsHtml = tags.length > 0 
    ? `<div class="memory-card-tags">${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
    : '';
  
  const archivedBadge = archived 
    ? '<span class="badge badge-archived">Archived</span>'
    : '';
  
  return `
    <div class="memory-card">
      <div class="memory-card-header">
        <div class="memory-card-meta">
          <div class="memory-card-id">${memory.id}</div>
          <div class="memory-card-badges">
            <span class="badge badge-importance">Importance: ${importance}%</span>
            <span class="badge badge-confidence">Confidence: ${confidence}%</span>
            ${archivedBadge}
          </div>
        </div>
        <div class="memory-card-actions">
          <button class="icon-btn edit-memory-btn" data-id="${memory.id}" title="Edit">Edit</button>
          <button class="icon-btn danger delete-memory-btn" data-id="${memory.id}" title="Delete">Delete</button>
        </div>
      </div>
      <div class="memory-card-content">${escapeHtml(memory.content)}</div>
      <div class="memory-card-footer">
        <div class="memory-card-footer-item"><strong>User:</strong> ${memory.metadata?.user || 'default'}</div>
        <div class="memory-card-footer-item"><strong>Project:</strong> ${memory.metadata?.project || 'general'}</div>
        <div class="memory-card-footer-item"><strong>Type:</strong> ${memory.metadata?.memory_type || 'general'}</div>
        <div class="memory-card-footer-item"><strong>Updated:</strong> ${formatDate(memory.metadata?.updated_at)}</div>
      </div>
      ${tagsHtml}
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

async function updateFilterDropdowns() {
  try {
    const result = await callMcpTool('list_memories', { limit: 100 });
    
    if (result.ok && result.memories) {
      const projects = new Set();
      const users = new Set();
      const types = new Set();
      
      result.memories.forEach(memory => {
        if (memory.metadata?.project) projects.add(memory.metadata.project);
        if (memory.metadata?.user) users.add(memory.metadata.user);
        if (memory.metadata?.memory_type) types.add(memory.metadata.memory_type);
      });
      
      // Update project filter
      const projectFilter = document.getElementById('filter-project');
      projectFilter.innerHTML = '<option value="">All Projects</option>' +
        Array.from(projects).sort().map(p => `<option value="${p}">${p}</option>`).join('');
      
      // Update user filter
      const userFilter = document.getElementById('filter-user');
      userFilter.innerHTML = '<option value="">All Users</option>' +
        Array.from(users).sort().map(u => `<option value="${u}">${u}</option>`).join('');
      
      // Update type filter
      const typeFilter = document.getElementById('filter-type');
      typeFilter.innerHTML = '<option value="">All Types</option>' +
        Array.from(types).sort().map(t => `<option value="${t}">${t}</option>`).join('');
    }
  } catch (error) {
    console.error('Failed to update filter dropdowns:', error);
  }
}

async function searchMemories() {
  const query = document.getElementById('memory-search').value.trim();
  
  if (!query) {
    await loadMemories();
    return;
  }
  
  const memoryList = document.getElementById('memory-list');
  memoryList.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Searching memories...</p>
    </div>
  `;
  
  try {
    const result = await callMcpTool('search_memories', {
      query,
      limit: 50,
      include_archived: false
    });
    
    if (result.ok && result.memories && result.memories.length > 0) {
      memoryList.innerHTML = result.memories.map(memory => renderMemoryCard(memory)).join('');
      
      // Attach event listeners
      document.querySelectorAll('.edit-memory-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditMemoryModal(btn.dataset.id));
      });
      
      document.querySelectorAll('.delete-memory-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteMemoryModal(btn.dataset.id));
      });
    } else {
      memoryList.innerHTML = `
        <div class="empty-state">
          <p>No memories found matching "${escapeHtml(query)}"</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to search memories:', error);
    memoryList.innerHTML = `
      <div class="empty-state">
        <p>Search failed: ${error.message}</p>
      </div>
    `;
  }
}

async function filterMemories() {
  const filters = {};
  
  const project = document.getElementById('filter-project').value;
  const user = document.getElementById('filter-user').value;
  const type = document.getElementById('filter-type').value;
  
  if (project) filters.project = project;
  if (user) filters.user = user;
  if (type) filters.memory_type = type;
  
  await loadMemories(filters);
}

function openAddMemoryModal() {
  document.getElementById('memory-modal-title').textContent = 'Add Memory';
  document.getElementById('memory-form').reset();
  document.getElementById('memory-id').value = '';
  document.getElementById('memory-importance').value = '0.5';
  document.getElementById('memory-confidence').value = '1';
  document.getElementById('memory-modal').style.display = 'flex';
}

async function openEditMemoryModal(memoryId) {
  try {
    const result = await callMcpTool('get_memories', { ids: [memoryId] });
    
    if (result.ok && result.memories && result.memories.length > 0) {
      const memory = result.memories[0];
      
      document.getElementById('memory-modal-title').textContent = 'Edit Memory';
      document.getElementById('memory-id').value = memory.id;
      document.getElementById('memory-content').value = memory.content;
      document.getElementById('memory-importance').value = memory.importance;
      document.getElementById('memory-confidence').value = memory.metadata?.confidence || 1;
      document.getElementById('memory-user').value = memory.metadata?.user || '';
      document.getElementById('memory-project').value = memory.metadata?.project || '';
      document.getElementById('memory-type').value = memory.metadata?.memory_type || '';
      document.getElementById('memory-source').value = memory.metadata?.source || '';
      document.getElementById('memory-tags').value = (memory.metadata?.tags || []).join(', ');
      
      document.getElementById('memory-modal').style.display = 'flex';
    }
  } catch (error) {
    console.error('Failed to load memory for editing:', error);
    alert('Failed to load memory: ' + error.message);
  }
}

function openDeleteMemoryModal(memoryId) {
  document.getElementById('delete-memory-id').value = memoryId;
  document.getElementById('hard-delete-checkbox').checked = false;
  document.getElementById('delete-modal').style.display = 'flex';
}

async function saveMemory(event) {
  event.preventDefault();
  
  const memoryId = document.getElementById('memory-id').value;
  const content = document.getElementById('memory-content').value.trim();
  const importance = parseFloat(document.getElementById('memory-importance').value);
  const confidence = parseFloat(document.getElementById('memory-confidence').value);
  const user = document.getElementById('memory-user').value.trim();
  const project = document.getElementById('memory-project').value.trim();
  const type = document.getElementById('memory-type').value.trim();
  const source = document.getElementById('memory-source').value.trim();
  const tagsInput = document.getElementById('memory-tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  if (!content) {
    alert('Content is required');
    return;
  }
  
  const saveBtn = document.getElementById('save-memory');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;
  
  try {
    const metadata = {
      confidence,
      tags
    };
    
    if (user) metadata.user = user;
    if (project) metadata.project = project;
    if (type) metadata.memory_type = type;
    if (source) metadata.source = source;
    
    if (memoryId) {
      // Update existing memory
      await callMcpTool('update_memory', {
        id: memoryId,
        content,
        importance,
        metadata
      });
    } else {
      // Add new memory
      await callMcpTool('add_memory', {
        content,
        importance,
        metadata
      });
    }
    
    // Close modal and refresh
    document.getElementById('memory-modal').style.display = 'none';
    await loadMemories();
    await loadMemoryStats();
  } catch (error) {
    console.error('Failed to save memory:', error);
    alert('Failed to save memory: ' + error.message);
  } finally {
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

async function deleteMemory() {
  const memoryId = document.getElementById('delete-memory-id').value;
  const hardDelete = document.getElementById('hard-delete-checkbox').checked;
  
  const confirmBtn = document.getElementById('confirm-delete');
  const originalText = confirmBtn.textContent;
  confirmBtn.textContent = 'Deleting...';
  confirmBtn.disabled = true;
  
  try {
    await callMcpTool('delete_memory', {
      id: memoryId,
      hard_delete: hardDelete
    });
    
    // Close modal and refresh
    document.getElementById('delete-modal').style.display = 'none';
    await loadMemories();
    await loadMemoryStats();
  } catch (error) {
    console.error('Failed to delete memory:', error);
    alert('Failed to delete memory: ' + error.message);
  } finally {
    confirmBtn.textContent = originalText;
    confirmBtn.disabled = false;
  }
}

async function refreshMemories() {
  await loadMemories();
  await loadMemoryStats();
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
    settingsBtn.addEventListener('click', async () => {
      // Fetch fresh API key from server
      const setupInfo = await fetchSetupInfo();
      if (setupInfo && setupInfo.apiKey) {
        settingsApiKey.textContent = setupInfo.apiKey;
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
      const originalText = settingsRegenerateApiKey.textContent;
      settingsRegenerateApiKey.textContent = 'Regenerating...';
      settingsRegenerateApiKey.disabled = true;
      
      try {
        const serverUrl = getCurrentServerUrl();
        const response = await fetch(`${serverUrl}/api/regenerate-api-key`, {
          method: 'POST'
        });
        const data = await response.json();
        
        if (data.ok) {
          // Update settings modal API key display
          settingsApiKey.textContent = data.apiKey;
          
          // Update hidden api-key-value element for auto-detection
          const apiKeyValue = document.getElementById('api-key-value');
          if (apiKeyValue) {
            apiKeyValue.textContent = data.apiKey;
          }
          
          // Update all config snippets with new key
          const configElements = document.querySelectorAll('pre[id$="-config"]');
          configElements.forEach(element => {
            const currentContent = element.textContent;
            if (currentContent.includes('${MEMORYLOOM_API_KEY}')) {
              element.textContent = currentContent.replace('${MEMORYLOOM_API_KEY}', data.apiKey);
            } else {
              element.textContent = currentContent.replace(/"Authorization":\s*"Bearer [^"]+"/, `"Authorization": "Bearer ${data.apiKey}"`);
            }
          });
          
          alert('API key regenerated successfully. Your MCP configurations have been updated.');
        } else {
          throw new Error(data.error || 'Failed to regenerate API key');
        }
      } catch (error) {
        console.error('Failed to regenerate API key:', error);
        alert('Failed to regenerate API key. Please try again.');
      } finally {
        settingsRegenerateApiKey.textContent = originalText;
        settingsRegenerateApiKey.disabled = false;
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
  document.getElementById('download-local')?.addEventListener('click', () => downloadConfig('local'));
  document.getElementById('download-gemini-vscode')?.addEventListener('click', () => downloadConfig('gemini-vscode'));
  document.getElementById('download-claude-cli')?.addEventListener('click', () => downloadConfig('claude-cli'));
  document.getElementById('download-gemini-cli')?.addEventListener('click', () => downloadConfig('gemini-cli'));
  document.getElementById('download-kiro')?.addEventListener('click', () => downloadConfig('kiro'));
  document.getElementById('download-antigravity')?.addEventListener('click', () => downloadConfig('antigravity'));
  
  // Memory Management Event Listeners
  document.getElementById('search-btn')?.addEventListener('click', searchMemories);
  document.getElementById('memory-search')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchMemories();
    }
  });
  
  document.getElementById('filter-project')?.addEventListener('change', filterMemories);
  document.getElementById('filter-user')?.addEventListener('change', filterMemories);
  document.getElementById('filter-type')?.addEventListener('change', filterMemories);
  
  document.getElementById('refresh-memories')?.addEventListener('click', refreshMemories);
  document.getElementById('add-memory-btn')?.addEventListener('click', openAddMemoryModal);
  
  // Memory Modal Event Listeners
  const memoryModal = document.getElementById('memory-modal');
  const closeMemoryModal = document.getElementById('close-memory-modal');
  const cancelMemory = document.getElementById('cancel-memory');
  const memoryForm = document.getElementById('memory-form');
  
  if (closeMemoryModal) {
    closeMemoryModal.addEventListener('click', () => {
      memoryModal.style.display = 'none';
    });
  }
  
  if (cancelMemory) {
    cancelMemory.addEventListener('click', () => {
      memoryModal.style.display = 'none';
    });
  }
  
  if (memoryModal) {
    memoryModal.addEventListener('click', (e) => {
      if (e.target === memoryModal) {
        memoryModal.style.display = 'none';
      }
    });
  }
  
  if (memoryForm) {
    memoryForm.addEventListener('submit', saveMemory);
  }
  
  // Delete Modal Event Listeners
  const deleteModal = document.getElementById('delete-modal');
  const closeDeleteModal = document.getElementById('close-delete-modal');
  const cancelDelete = document.getElementById('cancel-delete');
  const confirmDelete = document.getElementById('confirm-delete');
  
  if (closeDeleteModal) {
    closeDeleteModal.addEventListener('click', () => {
      deleteModal.style.display = 'none';
    });
  }
  
  if (cancelDelete) {
    cancelDelete.addEventListener('click', () => {
      deleteModal.style.display = 'none';
    });
  }
  
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        deleteModal.style.display = 'none';
      }
    });
  }
  
  if (confirmDelete) {
    confirmDelete.addEventListener('click', deleteMemory);
  }
  
  // Load initial memory data
  loadMemories();
});
