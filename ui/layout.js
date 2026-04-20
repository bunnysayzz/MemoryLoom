// Global Utility Functions for MemoryLoom UI

function getCurrentServerUrl() {
  return window.location.origin;
}

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

// Call an MCP Tool using the HTTP endpoint
async function callMcpTool(name, args = {}) {
  const serverUrl = getCurrentServerUrl();
  const setupInfo = await fetchSetupInfo();
  
  if (!setupInfo) {
    throw new Error('Could not connect to server.');
  }

  const payload = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: name,
      arguments: args
    }
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (setupInfo.apiKey) {
    headers['Authorization'] = `Bearer ${setupInfo.apiKey}`;
  }

  const response = await fetch(`${serverUrl}/mcp`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'Tool execution failed');
  }

  // Parse result from tool
  const content = data.result?.content?.[0];
  if (content && content.type === "text") {
    return JSON.parse(content.text);
  }

  return data.result;
}

// Initialize Sidebar and Health
document.addEventListener('DOMContentLoaded', async () => {
  // Highlight active nav link
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath || 
       (currentPath === '/' && link.getAttribute('href') === '/index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Check Server Health
  const healthDot = document.getElementById('global-health-dot');
  const healthText = document.getElementById('global-health-text');
  
  if (healthDot && healthText) {
    try {
      const response = await fetch(`${getCurrentServerUrl()}/health`);
      if (response.ok) {
        healthDot.classList.add('healthy');
        healthText.textContent = 'Connected';
      } else {
        healthText.textContent = 'Error';
      }
    } catch {
      healthText.textContent = 'Offline';
    }
  }
});
