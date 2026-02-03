// Configuration
const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:3000';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// State
let currentTabUrl = '';
let token = null;
let currentProducts = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadToken();
  await syncTokenFromFrontend(); // Try to sync from frontend
  setupEventListeners();
  await initializeExtension();
  
  // Set up periodic token sync (every 3 seconds when popup is open)
  setInterval(async () => {
    const wasTokenNull = !token;
    await syncTokenFromFrontend();
    
    // Update track button visibility on compare tab
    updateTrackButtonVisibility();
    
    // If token was null and now we have one, and we're on tracks tab, reload
    if (wasTokenNull && token) {
      const tracksTab = document.getElementById('myTracksTab');
      if (tracksTab && !tracksTab.classList.contains('hidden')) {
        loadTrackedProducts();
      }
    }
  }, 3000);
});

// Load token from storage
async function loadToken() {
  try {
    const result = await chrome.storage.local.get(['token']);
    token = result.token || null;
    
    // Also try to get token from frontend page (if open)
    await syncTokenFromFrontend();
  } catch (error) {
    console.error('Error loading token:', error);
  }
}

// Sync token from frontend page using content script
async function syncTokenFromFrontend() {
  try {
    // Try to find the frontend tab (localhost:3000)
    const tabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' });
    
    if (tabs.length > 0) {
      // Try to get token from the frontend tab
      for (const tab of tabs) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'getToken' });
          if (response && response.token) {
            // Only update if token changed
            if (token !== response.token) {
              await saveToken(response.token);
              console.log('✅ Token synced from frontend tab:', response.token.substring(0, 20) + '...');
              return true;
            }
            return true;
          }
        } catch (error) {
          // Tab might not be ready or content script not loaded
          // This is normal if content script hasn't loaded yet
          console.log('Could not get token from tab (will retry):', tab.id);
        }
      }
    }
    
    // Also try to get from cookies as fallback
    try {
      const cookies = await chrome.cookies.getAll({ domain: 'localhost' });
      const tokenCookie = cookies.find(c => c.name === 'token' || c.name === 'authToken');
      if (tokenCookie && tokenCookie.value && tokenCookie.value !== token) {
        await saveToken(tokenCookie.value);
        console.log('✅ Token synced from cookie');
        return true;
      }
    } catch (error) {
      // Cookie access might fail - this is expected in some cases
      console.log('Could not access cookies (this is normal)');
    }
    
    return false;
  } catch (error) {
    // Silently fail - this is expected if frontend is not open
    return false;
  }
}

// Save token to storage
async function saveToken(newToken) {
  try {
    await chrome.storage.local.set({ token: newToken });
    const oldToken = token;
    token = newToken;
    
    console.log('Token saved:', newToken ? 'Logged in' : 'Logged out');
    
    // Update track button visibility
    updateTrackButtonVisibility();
    
    // If token changed and we're on tracks tab, reload tracks
    if (oldToken !== newToken) {
      const tracksTab = document.getElementById('myTracksTab');
      if (tracksTab && !tracksTab.classList.contains('hidden')) {
        // We're on tracks tab, reload
        loadTrackedProducts();
      }
    }
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching - buttons are labeled confusingly in HTML
  // tracksTab button shows "Compare" and switches to compare tab
  // myTracksTab button shows "My Tracks" and switches to tracks tab
  const compareButton = document.getElementById('tracksTab'); // Button labeled "Compare"
  const tracksButton = document.getElementById('myTracksTab'); // Button labeled "My Tracks"
  
  if (compareButton) {
    compareButton.addEventListener('click', () => switchTab('compare'));
  }
  if (tracksButton) {
    tracksButton.addEventListener('click', () => switchTab('tracks'));
  }

  // Buttons
  document.getElementById('retryButton')?.addEventListener('click', initializeExtension);
  document.getElementById('manualSearchButton')?.addEventListener('click', showManualSearch);
  
  const trackButton = document.getElementById('trackProductButton');
  if (trackButton) {
    trackButton.addEventListener('click', trackCurrentProduct);
  }
  
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', openLoginPage);
  }
  
  const syncTokenButton = document.getElementById('syncTokenButton');
  if (syncTokenButton) {
    syncTokenButton.addEventListener('click', async () => {
      console.log('Manual token sync triggered');
      await syncTokenFromFrontend();
      const result = await chrome.storage.local.get(['token']);
      if (result.token) {
        token = result.token;
        alert('✅ Token synced successfully! Refreshing tracks...');
        loadTrackedProducts();
      } else {
        alert('❌ No token found. Please make sure you are logged in on http://localhost:3000');
      }
    });
  }

  // Listen for URL changes
  chrome.tabs.onActivated.addListener(initializeExtension);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      initializeExtension();
    }
  });
}

// Switch tabs
function switchTab(tab) {
  const compareTab = document.getElementById('compareTab');
  const tracksTabContent = document.getElementById('myTracksTab'); // The content div
  
  // Hide/show content tabs
  if (compareTab) {
    if (tab === 'compare') {
      compareTab.classList.remove('hidden');
      compareTab.classList.add('active');
    } else {
      compareTab.classList.add('hidden');
      compareTab.classList.remove('active');
    }
  }
  
  if (tracksTabContent) {
    if (tab === 'tracks') {
      tracksTabContent.classList.remove('hidden');
      // Sync token first, then load tracks
      syncTokenFromFrontend().then(() => {
        loadTrackedProducts();
      });
    } else {
      tracksTabContent.classList.add('hidden');
    }
  }
  
  // Update tab buttons
  const compareButton = document.getElementById('tracksTab'); // Button labeled "Compare"
  const tracksButton = document.getElementById('myTracksTab'); // Button labeled "My Tracks"
  
  if (compareButton) {
    compareButton.classList.toggle('active', tab === 'compare');
  }
  if (tracksButton) {
    tracksButton.classList.toggle('active', tab === 'tracks');
  }
}

// Initialize extension
async function initializeExtension() {
  try {
    // Get current tab URL
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      currentTabUrl = tabs[0].url || '';
      const displayUrl = currentTabUrl.length > 40 ? currentTabUrl.substring(0, 40) + '...' : currentTabUrl;
      document.getElementById('currentUrlText').textContent = displayUrl;
    }

    // Check if URL is from a supported platform
    const supportedPlatforms = ['amazon', 'flipkart', 'myntra', 'reliance', 'reliancedigital'];
    const isSupportedPlatform = supportedPlatforms.some(platform => 
      currentTabUrl.toLowerCase().includes(platform)
    );

    if (!isSupportedPlatform && !currentTabUrl) {
      showEmptyState();
      return;
    }

    // Check cache first (will show immediately if cached)
    const cached = await getCachedProduct(currentTabUrl);
    if (cached) {
      // Show cached results immediately (no loading spinner)
      currentProducts = cached.products;
      displayResults(currentProducts, true); // Show cached indicator
      // Fetch fresh data in background to update cache
      fetchAndUpdateCache(currentTabUrl);
      return;
    }

    // No cache, show loading and fetch
    showLoading();
    
    // Scrape product prices
    if (isSupportedPlatform) {
      await scrapeProductFromUrl(currentTabUrl);
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error('Error initializing:', error);
    showError('Failed to initialize extension');
  }
}

// Get cache key from URL
function getCacheKey(url) {
  return `product_${btoa(url).replace(/[/+=]/g, '')}`;
}

// Get cached product data (accepts URL or cache key)
async function getCachedProduct(urlOrKey) {
  try {
    // If it's already a cache key (starts with product_ or search_), use it directly
    // Otherwise, generate cache key from URL
    const cacheKey = urlOrKey.startsWith('product_') || urlOrKey.startsWith('search_') 
      ? urlOrKey 
      : getCacheKey(urlOrKey);
    
    const result = await chrome.storage.local.get([cacheKey]);
    const cached = result[cacheKey];
    
    if (!cached) return null;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    
    // Check if cache is still valid (within 2 hours)
    if (cacheAge < CACHE_DURATION) {
      console.log(`Using cached data (${Math.round(cacheAge / 1000 / 60)} minutes old)`);
      return cached.data;
    } else {
      // Cache expired, remove it
      await chrome.storage.local.remove([cacheKey]);
      console.log('Cache expired, will fetch fresh data');
      return null;
    }
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

// Save product data to cache (accepts URL or cache key)
async function saveToCache(urlOrKey, data) {
  try {
    // If it's already a cache key (starts with product_ or search_), use it directly
    // Otherwise, generate cache key from URL
    const cacheKey = urlOrKey.startsWith('product_') || urlOrKey.startsWith('search_') 
      ? urlOrKey 
      : getCacheKey(urlOrKey);
    
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      url: typeof urlOrKey === 'string' && !urlOrKey.startsWith('product_') && !urlOrKey.startsWith('search_') ? urlOrKey : null
    };
    await chrome.storage.local.set({ [cacheKey]: cacheData });
    console.log('Product data cached successfully');
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

// Scrape product from URL
async function scrapeProductFromUrl(url) {
  try {
    // Check cache first
    const cached = await getCachedProduct(url);
    if (cached) {
      currentProducts = cached.products;
      displayResults(currentProducts, true); // Show cached indicator
      // Optionally fetch in background to update cache
      fetchAndUpdateCache(url);
      return;
    }

    // No cache or expired, fetch from API
    showLoading();
    const response = await fetch(`${API_BASE}/aggregate-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ link: url }),
    });

    if (!response.ok) {
      throw new Error('Failed to scrape product');
    }

    const data = await response.json();
    currentProducts = normalizeProducts(data);
    
    // Save to cache
    await saveToCache(url, {
      products: currentProducts,
      rawData: data
    });
    
    displayResults(currentProducts);
  } catch (error) {
    console.error('Error scraping:', error);
    showError('Failed to load product prices. Make sure the backend server is running.');
  }
}

// Fetch in background to update cache (without showing loading)
async function fetchAndUpdateCache(url) {
  try {
    const response = await fetch(`${API_BASE}/aggregate-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ link: url }),
    });

    if (response.ok) {
      const data = await response.json();
      const products = normalizeProducts(data);
      
      // Update cache with fresh data
      await saveToCache(url, {
        products: products,
        rawData: data
      });
      
      // Update display if URL is still the same
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url === url) {
        currentProducts = products;
        displayResults(currentProducts);
      }
    }
  } catch (error) {
    console.log('Background fetch failed (non-critical):', error);
  }
}

// Normalize products from API response
function normalizeProducts(data) {
  const products = [];
  
  if (data.success && data.sources) {
    Object.keys(data.sources).forEach((platformKey) => {
      const source = data.sources[platformKey];
      if (source?.success && source?.data) {
        const platformMap = {
          amazon: 'amazon',
          flipkart: 'flipkart',
          relianceDigital: 'reliance',
          myntra: 'myntra'
        };
        
        const platform = platformMap[platformKey] || platformKey;
        const productData = source.data;
        
        // Parse price
        let price = 0;
        if (productData.price) {
          if (typeof productData.price === 'string') {
            price = parseFloat(productData.price.replace(/[₹,\s]/g, '')) || 0;
          } else {
            price = productData.price;
          }
        }
        
        // Parse MRP
        let mrp = null;
        if (productData.mrp) {
          if (typeof productData.mrp === 'string') {
            mrp = parseFloat(productData.mrp.replace(/[₹,\s]/g, '')) || null;
          } else {
            mrp = productData.mrp;
          }
        }
        
        // Parse discount
        let discount = null;
        if (productData.discount) {
          if (typeof productData.discount === 'string') {
            const match = productData.discount.match(/(\d+)%/);
            discount = match ? parseInt(match[1]) : null;
          } else {
            discount = productData.discount;
          }
        }
        
        products.push({
          platform,
          title: productData.title || productData.name || 'Product',
          price,
          mrp,
          discount,
          image: productData.imageUrl || productData.image || '/modern-tech-product.png',
          link: productData.productLink || productData.url || '#',
          rating: productData.rating?.stars || productData.rating || null,
        });
      }
    });
  }
  
  return products.sort((a, b) => a.price - b.price); // Sort by price
}

// Display results
async function displayResults(products, fromCache = false) {
  hideAllStates();
  document.getElementById('resultsContainer').classList.remove('hidden');
  
  // Show cache indicator
  const cacheBadge = document.getElementById('cacheBadge');
  if (fromCache) {
    cacheBadge.style.display = 'block';
  } else {
    cacheBadge.style.display = 'none';
  }
  
  if (products.length === 0) {
    showEmptyState();
    return;
  }
  
  // Show best deal
  const bestDeal = products[0]; // Already sorted by price
  if (bestDeal) {
    document.getElementById('bestDealPrice').textContent = formatPrice(bestDeal.price);
    document.getElementById('bestDealPlatform').textContent = 
      `Best price on ${bestDeal.platform.charAt(0).toUpperCase() + bestDeal.platform.slice(1)}`;
    document.getElementById('bestDealBanner').classList.remove('hidden');
  }
  
  // Display products
  const productsList = document.getElementById('productsList');
  productsList.innerHTML = products.map(product => createProductCard(product)).join('');
  
  // Sync token first, then show track button if logged in
  await syncTokenFromFrontend();
  updateTrackButtonVisibility();
}

// Update track button visibility
function updateTrackButtonVisibility() {
  const trackButton = document.getElementById('trackProductButton');
  if (!trackButton) return;
  
  if (token) {
    trackButton.classList.remove('hidden');
    console.log('Track button shown - user is logged in');
  } else {
    trackButton.classList.add('hidden');
    console.log('Track button hidden - user not logged in');
  }
}

// Create product card HTML
function createProductCard(product) {
  return `
    <div class="product-card">
      <div class="product-header">
        <img src="${product.image}" alt="${product.title}" class="product-image" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'64\\' height=\\'64\\'%3E%3Crect fill=\\'%23f1f5f9\\' width=\\'64\\' height=\\'64\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%2394a3b8\\' font-size=\\'10\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="product-info">
          <div class="product-title">${escapeHtml(product.title)}</div>
          <span class="platform-badge ${product.platform}">${product.platform}</span>
        </div>
      </div>
      <div class="product-details">
        <div class="price-section">
          <div class="current-price">${formatPrice(product.price)}</div>
          ${product.mrp && product.mrp > product.price ? 
            `<div class="original-price">${formatPrice(product.mrp)}</div>` : ''}
        </div>
        ${product.discount ? 
          `<div class="discount-badge">${product.discount}% OFF</div>` : ''}
        <a href="${product.link}" target="_blank" class="product-link">View</a>
      </div>
    </div>
  `;
}

// Format price
function formatPrice(price) {
  if (!price || price === 0) return 'N/A';
  return `₹${Math.round(price).toLocaleString('en-IN')}`;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Track current product
async function trackCurrentProduct() {
  if (!token) {
    openLoginPage();
    return;
  }
  
  if (currentProducts.length === 0) {
    showError('No product to track');
    return;
  }
  
  try {
    const productName = currentProducts[0].title || 'Product';
    const platforms = {};
    
    currentProducts.forEach(product => {
      platforms[product.platform] = {
        price: product.price,
        mrp: product.mrp,
        discount: product.discount,
        productLink: product.link,
        imageUrl: product.image,
        lastUpdated: new Date().toISOString(),
      };
    });
    
    const response = await fetch(`${API_BASE}/tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        productName,
        originalLink: currentTabUrl,
        platforms,
        notifyByEmail: true,
        notifyByWhatsApp: true,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to track product');
    }
    
    // Show success
    document.getElementById('trackProductButton').classList.add('hidden');
    document.getElementById('trackSuccess').classList.remove('hidden');
    
    // Hide success after 3 seconds
    setTimeout(() => {
      document.getElementById('trackSuccess').classList.add('hidden');
      document.getElementById('trackProductButton').classList.remove('hidden');
    }, 3000);
    
  } catch (error) {
    console.error('Error tracking product:', error);
    showError(error.message || 'Failed to track product');
  }
}

// Load tracked products
async function loadTrackedProducts() {
  console.log('Loading tracked products, current token:', token ? 'exists (' + token.substring(0, 20) + '...)' : 'null');
  
  // Sync token first before checking (try multiple times)
  let syncAttempts = 0;
  while (!token && syncAttempts < 3) {
    await syncTokenFromFrontend();
    syncAttempts++;
    if (!token) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
    }
  }
  
  // Reload token from storage after sync
  const result = await chrome.storage.local.get(['token']);
  if (result.token && result.token !== token) {
    token = result.token;
    console.log('Token loaded from storage after sync');
  }
  
  if (!token) {
    console.log('❌ No token found after sync, showing login required');
    document.getElementById('loginRequired').classList.remove('hidden');
    document.getElementById('loadingTracks').classList.add('hidden');
    document.getElementById('emptyTracks').classList.add('hidden');
    document.getElementById('tracksList').classList.add('hidden');
    return;
  }
  
  console.log('✅ Token found, proceeding to fetch tracks');
  
  try {
    console.log('Fetching tracks with token');
    document.getElementById('loginRequired').classList.add('hidden');
    document.getElementById('loadingTracks').classList.remove('hidden');
    document.getElementById('emptyTracks').classList.add('hidden');
    document.getElementById('tracksList').classList.add('hidden');
    
    const response = await fetch(`${API_BASE}/tracking`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Tracks API response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        console.log('Token expired/invalid, clearing token');
        await saveToken(null);
        loadTrackedProducts();
        return;
      }
      const errorText = await response.text();
      console.error('Failed to load tracks:', response.status, errorText);
      throw new Error('Failed to load tracked products');
    }
    
    const data = await response.json();
    console.log('Tracks API response:', data);
    
    // Handle different response formats
    let tracks = [];
    if (data.success && data.data) {
      tracks = data.data;
    } else if (Array.isArray(data)) {
      tracks = data;
    } else if (data.data && Array.isArray(data.data)) {
      tracks = data.data;
    } else if (data.tracks && Array.isArray(data.tracks)) {
      tracks = data.tracks;
    }
    
    console.log('Found tracks:', tracks.length);
    
    document.getElementById('loadingTracks').classList.add('hidden');
    
    if (tracks.length === 0) {
      document.getElementById('emptyTracks').classList.remove('hidden');
    } else {
      document.getElementById('tracksList').classList.remove('hidden');
      displayTrackedProducts(tracks);
    }
  } catch (error) {
    console.error('Error loading tracks:', error);
    document.getElementById('loadingTracks').classList.add('hidden');
    
    // Show error message
    const errorMsg = error.message || 'Failed to load tracked products. Make sure the backend server is running.';
    alert(errorMsg);
    
    // Show login required if it's an auth error
    if (error.message.includes('401') || error.message.includes('auth')) {
      document.getElementById('loginRequired').classList.remove('hidden');
      await saveToken(null);
    }
  }
}

// Display tracked products
function displayTrackedProducts(tracks) {
  const tracksList = document.getElementById('tracksList');
  
  if (!tracks || tracks.length === 0) {
    document.getElementById('emptyTracks').classList.remove('hidden');
    document.getElementById('tracksList').classList.add('hidden');
    return;
  }
  
  document.getElementById('emptyTracks').classList.add('hidden');
  document.getElementById('tracksList').classList.remove('hidden');
  tracksList.innerHTML = tracks.map(track => createTrackItem(track)).join('');
}

// Create track item HTML
function createTrackItem(track) {
  // Handle platforms - could be object, Map, or array
  let platforms = {};
  if (track.platforms) {
    if (track.platforms instanceof Map) {
      platforms = Object.fromEntries(track.platforms);
    } else if (Array.isArray(track.platforms)) {
      // If it's an array, convert to object
      platforms = track.platforms.reduce((acc, p) => {
        if (typeof p === 'string') {
          acc[p] = {};
        } else {
          acc[p.platform || p.name] = p;
        }
        return acc;
      }, {});
    } else {
      platforms = track.platforms;
    }
  }
  
  // Get image URL - check track.imageUrl first, then platforms
  let imageUrl = track.imageUrl || '';
  if (!imageUrl) {
    const platformValues = Object.values(platforms);
    if (platformValues.length > 0 && platformValues[0].imageUrl) {
      imageUrl = platformValues[0].imageUrl;
    }
  }
  
  // Get lowest price and platform
  const lowestPrice = track.lowestPrice || track.currentLowestPrice || 0;
  const lowestPricePlatform = track.lowestPricePlatform || track.currentLowestPricePlatform || 'Unknown';
  const productName = track.productName || 'Unknown Product';
  const trackId = track._id || track.id || '';
  
  return `
    <div class="track-item">
      ${imageUrl ? 
        `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(productName)}" class="track-item-image"
              onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'64\\' height=\\'64\\'%3E%3Crect fill=\\'%23f1f5f9\\' width=\\'64\\' height=\\'64\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%2394a3b8\\' font-size=\\'10\\'%3ENo Image%3C/text%3E%3C/svg%3E'">` : 
        `<div class="track-item-image-placeholder">📦</div>`}
      <div class="track-item-info">
        <div class="track-item-name">${escapeHtml(productName)}</div>
        <div class="track-item-price">${formatPrice(lowestPrice)}</div>
        <div class="track-item-platform">Best: ${lowestPricePlatform.charAt(0).toUpperCase() + lowestPricePlatform.slice(1)}</div>
      </div>
      <div class="track-item-actions">
        <button class="track-delete-btn" onclick="window.deleteTrack('${trackId}')">Delete</button>
      </div>
    </div>
  `;
}

// Make deleteTrack available globally
window.deleteTrack = deleteTrack;

// Delete track
async function deleteTrack(trackId) {
  if (!trackId) {
    console.error('No track ID provided');
    return;
  }
  
  if (!confirm('Are you sure you want to remove this product from tracking?')) {
    return;
  }
  
  if (!token) {
    showError('Please login to delete tracked products');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/tracking/${trackId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete tracked product');
    }
    
    loadTrackedProducts();
  } catch (error) {
    console.error('Error deleting track:', error);
    showError('Failed to delete tracked product');
  }
}

// Make deleteTrack global
window.deleteTrack = deleteTrack;

// Open login page
function openLoginPage() {
  chrome.tabs.create({ url: `${FRONTEND_BASE}/auth` });
}

// Show manual search
function showManualSearch() {
  const query = prompt('Enter product name to search:');
  if (query) {
    searchProduct(query);
  }
}

// Search product by name
async function searchProduct(query) {
  try {
    // Check cache for product name search
    const cacheKey = `search_${btoa(query).replace(/[/+=]/g, '')}`;
    const cached = await getCachedProduct(cacheKey);
    
    if (cached) {
      currentProducts = cached.products;
      displayResults(currentProducts, true); // Show cached indicator
      // Fetch in background to update
      fetchAndUpdateCacheForSearch(query, cacheKey);
      return;
    }
    
    showLoading();
    
    const response = await fetch(`${API_BASE}/aggregate-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productName: query }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to search product');
    }
    
    const data = await response.json();
    currentProducts = normalizeProducts(data);
    
    // Save to cache
    await saveToCache(cacheKey, {
      products: currentProducts,
      rawData: data
    });
    
    displayResults(currentProducts);
  } catch (error) {
    console.error('Error searching:', error);
    showError('Failed to search product');
  }
}

// Fetch in background for search queries
async function fetchAndUpdateCacheForSearch(query, cacheKey) {
  try {
    const response = await fetch(`${API_BASE}/aggregate-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productName: query }),
    });

    if (response.ok) {
      const data = await response.json();
      const products = normalizeProducts(data);
      
      await saveToCache(cacheKey, {
        products: products,
        rawData: data
      });
      
      // Update display if still on same search
      if (document.getElementById('currentUrlText').textContent.includes(query)) {
        currentProducts = products;
        displayResults(currentProducts);
      }
    }
  } catch (error) {
    console.log('Background search fetch failed:', error);
  }
}

// Show/hide states
function showLoading() {
  hideAllStates();
  document.getElementById('loadingState').classList.remove('hidden');
}

function showError(message) {
  hideAllStates();
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorMessage').textContent = message;
}

function showEmptyState() {
  hideAllStates();
  document.getElementById('emptyState').classList.remove('hidden');
}

function hideAllStates() {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('resultsContainer').classList.add('hidden');
}

// Listen for auth messages from background/content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'auth' && request.token) {
    saveToken(request.token).then(() => {
      // Reload tracks if on tracks tab
      if (document.getElementById('myTracksTab')?.classList.contains('active')) {
        loadTrackedProducts();
      }
      sendResponse({ success: true });
    });
    return true;
  }
});

