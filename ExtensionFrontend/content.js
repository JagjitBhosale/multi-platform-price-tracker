// Content script - runs on all pages
// Detects product pages, sends URL to popup, and handles auth token sync

// Check if current page is a product page from supported platforms
function isProductPage(url) {
  const productPatterns = {
    amazon: /amazon\.(in|com)\/.+\/(dp|gp\/product)\//,
    flipkart: /flipkart\.com\/.+\/p\//,
    myntra: /myntra\.com\/.+\/p\//,
    reliance: /reliancedigital\.in\/.+\/p\//,
  };
  
  return Object.values(productPatterns).some(pattern => pattern.test(url));
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentUrl') {
    sendResponse({ url: window.location.href });
  }
  
  if (request.action === 'getToken') {
    // Get token from multiple sources
    try {
      const { token, user } = getTokenFromSources();
      if (token) {
        // Send token to extension
        chrome.runtime.sendMessage({
          action: 'auth',
          token: token,
          user: user
        }).catch(() => {
          // Extension might not be listening
        });
        sendResponse({ token: token, user: user });
      } else {
        sendResponse({ token: null, user: null });
      }
    } catch (error) {
      console.error('Error in getToken:', error);
      sendResponse({ token: null, user: null });
    }
    return true;
  }
});

// Function to get token from multiple sources
function getTokenFromSources() {
  let token = null;
  let user = null;
  
  try {
    // First, try localStorage
    token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    
    // If no token in localStorage, try to get from cookies
    if (!token) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = cookie.trim();
        // Look for token cookie or session cookie
        if (cookie.startsWith('token=')) {
          token = cookie.substring(6);
        } else if (cookie.startsWith('authToken=')) {
          token = cookie.substring(10);
        }
      }
    }
    
    // If still no token, try to get from window object (some auth libs store it there)
    if (!token && window.__NEXT_DATA__) {
      const nextData = window.__NEXT_DATA__;
      if (nextData.props && nextData.props.pageProps && nextData.props.pageProps.token) {
        token = nextData.props.pageProps.token;
      }
    }
    
    return { token, user };
  } catch (error) {
    console.error('Error getting token:', error);
    return { token: null, user: null };
  }
}

// Function to sync token from frontend to extension
function syncTokenToExtension() {
  try {
    const { token, user } = getTokenFromSources();
    
    if (token) {
      console.log('✅ Found token, syncing to extension');
      // Send token to extension
      chrome.runtime.sendMessage({
        action: 'auth',
        token: token,
        user: user
      }).catch(() => {
        // Extension might not be installed
      });
    } else {
      console.log('❌ No token found');
      // No token, send logout signal
      chrome.runtime.sendMessage({
        action: 'auth',
        token: null
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Error syncing token:', error);
  }
}

// Monitor localStorage and cookies for token changes (for frontend pages)
if (window.location.hostname === 'localhost' && window.location.port === '3000') {
  // Sync immediately when content script loads
  syncTokenToExtension();
  
  // Monitor for token changes in localStorage
  let lastToken = null;
  let lastCookieToken = null;
  
  function checkTokenChanges() {
    try {
      const { token } = getTokenFromSources();
      const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='));
      
      if (token !== lastToken || cookieToken !== lastCookieToken) {
        lastToken = token;
        lastCookieToken = cookieToken;
        syncTokenToExtension();
      }
    } catch (error) {
      // Handle error
    }
  }
  
  // Check every second
  setInterval(checkTokenChanges, 1000);
  
  // Also listen for storage events (when token changes in another tab)
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' || e.key === 'user') {
      syncTokenToExtension();
    }
  });
  
  // Listen for custom events (in case frontend dispatches token update events)
  window.addEventListener('tokenUpdate', syncTokenToExtension);
  window.addEventListener('authUpdate', syncTokenToExtension);
}

