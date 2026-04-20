const fs = require('fs');

const oldIndexHtml = fs.readFileSync('/tmp/old_index.html', 'utf8');
const settingsHtml = fs.readFileSync('ui/settings.html', 'utf8');

// Extract tab buttons
const tabButtonsMatch = oldIndexHtml.match(/<div class="setup-tabs">[\s\S]*?<div class="tab-buttons">([\s\S]*?)<\/div>/);
let tabButtons = tabButtonsMatch[1].trim();

// The old tab buttons have `data-tab`. We need to change it to `data-target` for our new code.
tabButtons = tabButtons.replace(/data-tab="/g, 'data-target="');
tabButtons = tabButtons.replace(/aria-label="[^"]*"/g, ''); // remove aria labels to save space
tabButtons = tabButtons.replace(/<button /g, '<button ');

// Extract tab panels
const tabPanelsRegex = /<div class="tab-content(?: active)?" id="([^"]+)">([\s\S]*?)<\/div>\s*(?=<div class="tab-content|<\/div>\s*<\/section>)/g;
let panelsHTML = '';
let match;
while ((match = tabPanelsRegex.exec(oldIndexHtml)) !== null) {
  const tabId = match[1];
  const newTabId = tabId.replace('-tab', '-panel');
  let content = match[2];
  
  // Transform the old HTML structure to the new one
  // Old:
  // <h3>...</h3>
  // <p>...</p>
  // <div class="code-block"> ... <pre id="...">...</pre></div>
  // <p class="note">...</p>
  
  // Extract heading
  const headingMatch = content.match(/<h3>(.*?)<\/h3>/);
  const heading = headingMatch ? headingMatch[1] : '';
  
  // Extract path note
  const noteMatch = content.match(/<p class="note">([\s\S]*?)<\/p>/);
  const note = noteMatch ? noteMatch[1].replace(/<strong>Config Location:<\/strong>\s*/, '') : '';
  
  // Extract config JSON
  const preMatch = content.match(/<pre id="([^"]+)">([\s\S]*?)<\/pre>/);
  const configId = preMatch ? preMatch[1] : '';
  const configJSON = preMatch ? preMatch[2] : '';
  
  // Create new structure
  let newContent = `
          <div id="${newTabId}" class="tab-panel ${tabId === 'claude-tab' ? 'active' : ''}">
            <h4>${heading}</h4>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Config Location: ${note}</p>
            <pre>
              <div class="code-actions" style="position: absolute; top: 8px; right: 8px; display: flex; gap: 8px;">
                <button class="copy-btn">Copy</button>
                <button class="download-btn btn-ghost" style="padding: 4px 12px; font-size: 0.8rem;" data-editor="${configId.replace('-config', '').replace('-setup', '')}">Download</button>
              </div>
              <code id="${configId}">${configJSON}</code>
            </pre>
          </div>`;
  
  panelsHTML += newContent;
}

// Replace in settings.html
let newSettingsHtml = settingsHtml.replace(
  /<div class="tab-list">([\s\S]*?)<\/div>\s*<div class="tab-panels">([\s\S]*?)<\/div>\s*<\/div>/,
  `<div class="tab-list">\n${tabButtons}\n</div>\n<div class="tab-panels">\n${panelsHTML}\n</div>\n</div>`
);

fs.writeFileSync('ui/settings.html', newSettingsHtml);
console.log('Successfully updated settings.html');
