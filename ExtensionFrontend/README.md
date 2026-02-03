# PriceCompare Chrome Extension

A Chrome extension to compare product prices across Amazon, Flipkart, Myntra, and Reliance Digital. Automatically detects product pages and shows prices from all platforms.

## Features

- 🚀 **Auto-detect product pages** - Automatically scrapes prices when on a product page
- 📊 **Compare prices** - Shows prices from all platforms side by side
- 🏆 **Best deal highlight** - Highlights the lowest price
- 📌 **Track products** - Add products to tracking for price monitoring
- 📋 **My Tracks** - View all your tracked products
- 🎨 **Modern UI** - Clean, minimalistic design matching the web app

## Installation

### Development Setup

1. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `ExtensionFrontend` folder

2. **Start the backend server:**
   ```bash
   cd Backend
   npm run dev
   ```

3. **Start the frontend (optional, for login):**
   ```bash
   cd Frontend
   npm run dev
   ```

## Usage

1. **Navigate to a product page** on Amazon, Flipkart, Myntra, or Reliance Digital
2. **Click the extension icon** in the toolbar
3. The extension will automatically detect the product and show prices from all platforms
4. Click "Add to Track" to monitor the product price

## Configuration

The extension connects to:
- **Backend API**: `http://localhost:5000/api`
- **Frontend**: `http://localhost:3000` (for login)

To change these, edit `popup.js`:
```javascript
const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:3000';
```

## Icons

Create icon files in the `icons/` folder:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

You can use a placeholder or design custom icons.

## Authentication

1. Click "Login" in the extension (or in "My Tracks" tab)
2. This opens the frontend login page
3. After login, the token is automatically saved
4. You can now track products

## Files Structure

```
ExtensionFrontend/
├── manifest.json       # Extension configuration
├── popup.html         # Extension UI
├── styles.css         # Styling
├── popup.js          # Main logic
├── content.js        # Content script (runs on pages)
├── background.js     # Background service worker
├── icons/            # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md         # This file
```

## Troubleshooting

### Extension not loading prices
- Make sure the backend server is running on `http://localhost:5000`
- Check browser console for errors (Right-click extension icon → Inspect popup)

### CORS errors
- The backend should allow CORS from `chrome-extension://` origin
- Check `Backend/src/index.js` CORS configuration

### Can't track products
- Make sure you're logged in
- Check that the token is saved in extension storage
- Verify backend `/api/tracking` endpoint is working

## Development

### Testing Changes
1. Make changes to files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test the changes

### Debugging
- **Popup**: Right-click extension icon → Inspect popup
- **Background**: Go to `chrome://extensions/` → Service worker
- **Content Script**: Open DevTools on any page

## Production Build

Before deploying:
1. Update `manifest.json` version
2. Replace API URLs with production URLs
3. Create production icons
4. Test all features
5. Pack extension: `chrome://extensions/` → Pack extension

