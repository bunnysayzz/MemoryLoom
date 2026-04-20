document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyDisplay = document.getElementById('api-key-value');
  const copyBtn = document.getElementById('copy-api-key');
  const regenerateBtn = document.getElementById('regenerate-key-btn');

  let setupInfo = await fetchSetupInfo();

  function updateConfigBlocks() {
    if (!setupInfo) return;
    
    document.querySelectorAll('code[id$="-config"]').forEach(block => {
      let text = block.textContent;
      text = text.replace(/\$\{MCP_URL\}/g, setupInfo.mcpUrl);
      text = text.replace(/\$\{MEMORYLOOM_API_KEY\}/g, setupInfo.apiKey);
      block.textContent = text;
    });
  }

  if (setupInfo && setupInfo.apiKey) {
    apiKeyDisplay.textContent = setupInfo.apiKey;
    updateConfigBlocks();
  }

  // Handle Copy API Key
  copyBtn.addEventListener('click', () => {
    if (setupInfo?.apiKey) {
      navigator.clipboard.writeText(setupInfo.apiKey);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.style.background = 'var(--accent-green)';
      copyBtn.style.color = '#000';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
        copyBtn.style.color = '';
      }, 2000);
    }
  });

  // Handle Regenerate Key
  regenerateBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to regenerate your API key? All your editor connections will break until you update them.')) {
      return;
    }

    regenerateBtn.textContent = 'Regenerating...';
    regenerateBtn.disabled = true;

    try {
      const response = await fetch(`${getCurrentServerUrl()}/api/regenerate-api-key`, { method: 'POST' });
      const data = await response.json();
      
      if (data.ok) {
        // Reset the config blocks back to placeholder before updating
        document.querySelectorAll('code[id$="-config"]').forEach(block => {
          block.textContent = block.textContent.replace(setupInfo.apiKey, '${MEMORYLOOM_API_KEY}');
        });
        
        setupInfo.apiKey = data.apiKey;
        apiKeyDisplay.textContent = data.apiKey;
        updateConfigBlocks();
        
        alert('API Key regenerated successfully. Please update your editor configs.');
      } else {
        alert('Failed to regenerate key.');
      }
    } catch (error) {
      alert('Error regenerating key.');
    } finally {
      regenerateBtn.textContent = 'Regenerate Key';
      regenerateBtn.disabled = false;
    }
  });

  // Handle Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target') + '-panel';
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Handle snippet copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const codeBlock = e.target.nextElementSibling;
      navigator.clipboard.writeText(codeBlock.textContent);
      
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      btn.style.background = 'var(--accent-green)';
      btn.style.color = '#000';
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    });
  });

  // Handle snippet download buttons
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const editor = e.target.getAttribute('data-editor');
      downloadConfig(editor);
    });
  });

  function downloadConfig(editor) {
    let config;
    let filename;
    
    switch(editor) {
      case 'claude':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'claude_desktop_config.json';
        break;
      case 'cursor':
        config = { "context_servers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'cursor_config.json';
        break;
      case 'vscode':
        config = { "github.copilot.mcp.servers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'vscode_settings.json';
        break;
      case 'windsurf':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'windsurf_config.json';
        break;
      case 'zed':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'zed_config.json';
        break;
      case 'continue':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'continue_config.json';
        break;
      case 'aider':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'aider_config.json';
        break;
      case 'jetbrains':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'jetbrains_config.json';
        break;
      case 'codeium':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'codeium_config.json';
        break;
      case 'tabby':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'tabby_config.json';
        break;
      case 'replit':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'replit_config.json';
        break;
      case 'cline':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'cline_config.json';
        break;
      case 'roocode':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'roocode_config.json';
        break;
      case 'local':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'http_mcp_config.json';
        break;
      case 'gemini-vscode':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'gemini_vscode_config.json';
        break;
      case 'claude-cli':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'claude_cli_config.json';
        break;
      case 'gemini-cli':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'gemini_cli_config.json';
        break;
      case 'kiro':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'kiro_config.json';
        break;
      case 'antigravity':
        config = { "mcpServers": { "memoryloom": { "url": "${MCP_URL}", "headers": { "Authorization": "Bearer ${MEMORYLOOM_API_KEY}" } } } };
        filename = 'antigravity_config.json';
        break;
    }
    
    if (setupInfo && setupInfo.apiKey) {
      const configString = JSON.stringify(config, null, 2);
      let configWithValues = configString.replace(/\$\{MEMORYLOOM_API_KEY\}/g, setupInfo.apiKey);
      if (setupInfo.mcpUrl) {
        configWithValues = configWithValues.replace(/\$\{MCP_URL\}/g, setupInfo.mcpUrl);
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
    } else {
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
});
