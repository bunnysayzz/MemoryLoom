document.addEventListener('DOMContentLoaded', async () => {
  try {
    const stats = await callMcpTool('memory_stats');
    
    document.getElementById('stat-total').textContent = stats.total_memories || 0;
    document.getElementById('stat-active').textContent = stats.active_memories || 0;
    document.getElementById('stat-archived').textContent = stats.archived_memories || 0;
    document.getElementById('stat-storage').textContent = (stats.storage_mode || 'JSON').toUpperCase();
    
  } catch (error) {
    console.error('Failed to load dashboard stats', error);
  }
});
