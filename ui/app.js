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
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const text = element.textContent || element.innerText;
  navigator.clipboard.writeText(text).then(() => {
    // Show feedback
    const button = document.querySelector(`[onclick="copyToClipboard('${elementId}')"]`);
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

// Health check functionality
async function checkServerHealth() {
  const serverUrl = getCurrentServerUrl();
  
  try {
    // Check server status
    const healthResponse = await fetch(`${serverUrl}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.ok) {
      updateHealthStatus('server-status', '✅ Online', 'healthy');
      updateHealthStatus('storage-mode', healthData.storage?.mode || 'JSON', 'healthy');
      
      // Try to get memory stats
      try {
        const statsResponse = await fetch(`${serverUrl}/ready`);
        const statsData = await statsResponse.json();
        if (statsData.ok) {
          updateHealthStatus('memory-count', 'Ready', 'healthy');
        }
      } catch (e) {
        updateHealthStatus('memory-count', 'Unknown', 'warning');
      }
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
  initializeTabs();
  initializeSmoothScrolling();
  initializeRevealAnimation();
  checkServerHealth();
});

// Make copyToClipboard available globally for onclick handlers
window.copyToClipboard = copyToClipboard;
