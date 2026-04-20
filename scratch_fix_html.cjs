const fs = require('fs');

let html = fs.readFileSync('ui/settings.html', 'utf8');

// Replace the `<pre>` opening tag with `<div class="code-block-container" style="position: relative;">` and the `<pre>` after the actions
html = html.replace(/<pre>\s*<div class="code-actions"/g, '<div class="code-block-container" style="position: relative;">\n              <div class="code-actions"');

// Close the div after </pre>
html = html.replace(/<\/pre>/g, '</pre>\n            </div>');

// The `<pre>` tag is missing before `<code`. We need to insert it.
// The code actions block ends with `<\/div>\s*<code`
html = html.replace(/(<\/div>)\s*<code/g, '$1\n              <pre>\n                <code');

fs.writeFileSync('ui/settings.html', html);
console.log('Fixed settings.html HTML structure.');
