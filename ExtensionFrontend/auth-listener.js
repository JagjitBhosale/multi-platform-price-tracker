// Auth listener - runs on the frontend page
// Sends auth token to extension when user logs in

// Listen for storage changes (when token is saved)
window.addEventListener('storage', (e) => {
  if (e.key === 'token' && e.newValue) {
    // Notify extension about new token
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          action: 'auth',
          token: e.newValue
        });
      } catch (error) {
        // Extension might not be installed or context invalid
        console.log('Could not send token to extension:', error);
      }
    }
  }
});

// Also check on page load if already logged in
if (typeof localStorage !== 'undefined' && localStorage.getItem('token')) {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      chrome.runtime.sendMessage({
        action: 'auth',
        token: localStorage.getItem('token')
      });
    } catch (error) {
      // Extension might not be installed
      console.log('Could not send token to extension:', error);
    }
  }
}

