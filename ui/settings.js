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
});
