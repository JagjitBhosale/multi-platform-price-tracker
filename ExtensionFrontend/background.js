// Background service worker
// Handles extension lifecycle and communication

chrome.runtime.onInstalled.addListener(() => {
  console.log('PriceCompare extension installed');
});

// Listen for auth messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'auth') {
    const data = { token: request.token };
    if (request.user) {
      data.user = request.user;
    }
    
    chrome.storage.local.set(data, () => {
      console.log('Token saved to extension storage:', request.token ? 'Logged in' : 'Logged out');
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
  
  // Also listen for tab updates to sync token when frontend tab changes
  if (request.action === 'syncToken') {
    syncTokenFromTabs();
    sendResponse({ success: true });
    return true;
  }
  
  // Forward other messages if needed
  return false;
});

// Sync token from all frontend tabs
async function syncTokenFromTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' });
    for (const tab of tabs) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getToken' });
        if (response && response.token) {
          await chrome.storage.local.set({ token: response.token });
          console.log('Token synced from tab');
        }
      } catch (error) {
        // Tab might not be ready
      }
    }
  } catch (error) {
    console.error('Error syncing token:', error);
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // When frontend tab finishes loading, try to sync token
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('localhost:3000')) {
    setTimeout(() => {
      syncTokenFromTabs();
    }, 1000); // Wait a bit for page to fully load
  }
});

