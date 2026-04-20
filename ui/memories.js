let memoryCache = [];
let debounceTimer;

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('memory-search');
  const refreshBtn = document.getElementById('refresh-memories');
  const projectFilter = document.getElementById('filter-project');
  const userFilter = document.getElementById('filter-user');
  
  const addBtn = document.getElementById('add-memory-btn');
  const modal = document.getElementById('memory-modal');
  const closeModal = document.getElementById('close-memory-modal');
  const cancelBtn = document.getElementById('cancel-memory');
  const memoryForm = document.getElementById('memory-form');
  const saveBtn = document.getElementById('save-memory');
  const deleteBtn = document.getElementById('delete-memory');

  // Load Memories
  async function loadMemories(query = '') {
    const listEl = document.getElementById('memory-list');
    listEl.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
      let result;
      const filters = {};
      if (projectFilter.value) filters.project = projectFilter.value;
      if (userFilter.value) filters.user = userFilter.value;

      if (query.trim()) {
        result = await callMcpTool('search_memories', { query, limit: 50, filters });
      } else {
        result = await callMcpTool('list_memories', { limit: 50, filters });
      }

      memoryCache = result.memories || [];
      renderMemories(memoryCache);
      updateFilterDropdowns(memoryCache);
    } catch (err) {
      listEl.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>Failed to load memories: ${err.message}</p>
        </div>`;
    }
  }

  function renderMemories(memories) {
    const listEl = document.getElementById('memory-list');
    listEl.innerHTML = '';

    if (memories.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <p>No memories found matching your criteria.</p>
        </div>`;
      return;
    }

    memories.forEach(memory => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      
      const tags = (memory.metadata?.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
      
      const dateStr = memory.metadata?.updated_at 
        ? new Date(memory.metadata.updated_at).toLocaleDateString() 
        : 'Unknown Date';

      card.innerHTML = `
        <div class="memory-content">${escapeHtml(memory.content)}</div>
        ${tags ? `<div class="tag-list">${tags}</div>` : ''}
        <div class="memory-meta">
          <span>Project: ${escapeHtml(memory.metadata?.project || 'general')}</span>
          <span>${dateStr}</span>
        </div>
      `;

      card.addEventListener('click', () => openModal(memory));
      listEl.appendChild(card);
    });
  }

  function updateFilterDropdowns(memories) {
    // Only update if not currently filtering by them
    if (!projectFilter.value) {
      const projects = [...new Set(memories.map(m => m.metadata?.project).filter(Boolean))];
      const currentVal = projectFilter.value;
      projectFilter.innerHTML = '<option value="">All Projects</option>' + 
        projects.map(p => `<option value="${p}">${p}</option>`).join('');
      projectFilter.value = currentVal;
    }
    
    if (!userFilter.value) {
      const users = [...new Set(memories.map(m => m.metadata?.user).filter(Boolean))];
      const currentVal = userFilter.value;
      userFilter.innerHTML = '<option value="">All Users</option>' + 
        users.map(u => `<option value="${u}">${u}</option>`).join('');
      userFilter.value = currentVal;
    }
  }

  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Modal Logic
  function openModal(memory = null) {
    const title = document.getElementById('memory-modal-title');
    document.getElementById('memory-id').value = memory ? memory.id : '';
    
    if (memory) {
      title.textContent = 'Edit Memory';
      document.getElementById('memory-content').value = memory.content;
      document.getElementById('memory-importance').value = memory.importance || 0.5;
      document.getElementById('memory-confidence').value = memory.metadata?.confidence || 1.0;
      document.getElementById('memory-project').value = memory.metadata?.project || '';
      document.getElementById('memory-user').value = memory.metadata?.user || '';
      document.getElementById('memory-tags').value = (memory.metadata?.tags || []).join(', ');
      deleteBtn.style.display = 'block';
    } else {
      title.textContent = 'Add Memory';
      memoryForm.reset();
      deleteBtn.style.display = 'none';
      document.getElementById('memory-importance').value = 0.5;
      document.getElementById('memory-confidence').value = 1.0;
    }
    
    modal.classList.add('active');
  }

  function close() {
    modal.classList.remove('active');
  }

  addBtn.addEventListener('click', () => openModal());
  closeModal.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  // Save/Delete Actions
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!memoryForm.reportValidity()) return;

    const id = document.getElementById('memory-id').value;
    const content = document.getElementById('memory-content').value;
    const importance = parseFloat(document.getElementById('memory-importance').value);
    const confidence = parseFloat(document.getElementById('memory-confidence').value);
    
    const project = document.getElementById('memory-project').value.trim();
    const user = document.getElementById('memory-user').value.trim();
    const tagsStr = document.getElementById('memory-tags').value;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    const metadata = { confidence, tags };
    if (project) metadata.project = project;
    if (user) metadata.user = user;

    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
      if (id) {
        await callMcpTool('update_memory', { id, content, importance, metadata });
      } else {
        await callMcpTool('add_memory', { content, importance, metadata });
      }
      close();
      loadMemories(searchInput.value);
    } catch (err) {
      alert(`Error saving memory: ${err.message}`);
    } finally {
      saveBtn.textContent = 'Save Memory';
      saveBtn.disabled = false;
    }
  });

  deleteBtn.addEventListener('click', async () => {
    const id = document.getElementById('memory-id').value;
    if (!id || !confirm('Are you sure you want to permanently delete this memory?')) return;

    deleteBtn.textContent = 'Deleting...';
    deleteBtn.disabled = true;

    try {
      await callMcpTool('delete_memory', { id, hard_delete: true });
      close();
      loadMemories(searchInput.value);
    } catch (err) {
      alert(`Error deleting memory: ${err.message}`);
    } finally {
      deleteBtn.textContent = 'Delete';
      deleteBtn.disabled = false;
    }
  });

  // Event Listeners
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadMemories(e.target.value);
    }, 400);
  });

  refreshBtn.addEventListener('click', () => loadMemories(searchInput.value));
  projectFilter.addEventListener('change', () => loadMemories(searchInput.value));
  userFilter.addEventListener('change', () => loadMemories(searchInput.value));

  // Initial Load
  loadMemories();
});
