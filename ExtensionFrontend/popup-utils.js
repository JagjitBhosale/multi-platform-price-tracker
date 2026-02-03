// Utility functions for cache management

// Clear all cached products
export async function clearCache() {
  try {
    const items = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(items).filter(key => 
      key.startsWith('product_') || key.startsWith('search_')
    );
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`Cleared ${keysToRemove.length} cached items`);
      return keysToRemove.length;
    }
    return 0;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return 0;
  }
}

// Get cache statistics
export async function getCacheStats() {
  try {
    const items = await chrome.storage.local.get(null);
    const cachedItems = Object.keys(items).filter(key => 
      key.startsWith('product_') || key.startsWith('search_')
    );
    
    const now = Date.now();
    const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours
    let valid = 0;
    let expired = 0;
    
    cachedItems.forEach(key => {
      const cached = items[key];
      if (cached && cached.timestamp) {
        const age = now - cached.timestamp;
        if (age < CACHE_DURATION) {
          valid++;
        } else {
          expired++;
        }
      }
    });
    
    return {
      total: cachedItems.length,
      valid: valid,
      expired: expired
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { total: 0, valid: 0, expired: 0 };
  }
}

