document.addEventListener('DOMContentLoaded', async () => {
  try {
    const statsResult = await callMcpTool('memory_stats');
    
    if (statsResult.ok && statsResult.stats) {
      document.getElementById('stat-total').textContent = statsResult.stats.total || 0;
      document.getElementById('stat-active').textContent = statsResult.stats.active || 0;
      document.getElementById('stat-archived').textContent = statsResult.stats.archived || 0;
    }

    const statusResult = await callMcpTool('server_status');
    if (statusResult.ok && statusResult.status) {
      const storageMode = statusResult.status.storage?.mode || 'JSON';
      document.getElementById('stat-storage').textContent = storageMode.toUpperCase();
    }
    
  } catch (error) {
    console.error('Failed to load dashboard stats', error);
  }
});
