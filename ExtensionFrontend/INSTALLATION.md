# Chrome Extension Installation Guide

## Step-by-Step Installation

### 1. Prepare the Extension

1. **Create Icons** (optional for testing):
   - Create three PNG files in `ExtensionFrontend/icons/`:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - Or use colored squares as placeholders

### 2. Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Select the `ExtensionFrontend` folder
6. The extension should now appear in your extensions list

### 3. Pin Extension to Toolbar (Optional)

1. Click the **Extensions** icon (puzzle piece) in Chrome toolbar
2. Find "PriceCompare" extension
3. Click the **pin icon** to pin it to your toolbar

### 4. Start Backend Server

```bash
cd Backend
npm run dev
```

Make sure the backend is running on `http://localhost:5000`

### 5. Start Frontend (for Login)

```bash
cd Frontend
npm run dev
```

Make sure the frontend is running on `http://localhost:3000`

## Usage

1. **Visit a product page** on:
   - Amazon (amazon.in/amazon.com)
   - Flipkart (flipkart.com)
   - Myntra (myntra.com)
   - Reliance Digital (reliancedigital.in)

2. **Click the extension icon** in your Chrome toolbar

3. **View prices** - The extension will automatically detect the product and show prices from all platforms

4. **Add to Track** - Click "Add to Track" button to monitor the product (requires login)

5. **View My Tracks** - Click "My Tracks" tab to see all your tracked products

## Features

- ✅ **Auto-detection** - Automatically detects product pages
- ✅ **Price comparison** - Shows prices from Amazon, Flipkart, Myntra, Reliance
- ✅ **Best deal highlight** - Highlights the lowest price
- ✅ **Track products** - Add products to tracking
- ✅ **View tracks** - See all your tracked products
- ✅ **Modern UI** - Clean, minimalistic design

## Troubleshooting

### Extension not loading
- Check that all files are in `ExtensionFrontend/` folder
- Verify `manifest.json` is valid JSON
- Check for errors in `chrome://extensions/` (click "Errors" button)

### Prices not loading
- Make sure backend server is running on `http://localhost:5000`
- Check browser console (Right-click extension icon → Inspect popup)
- Verify CORS is enabled in backend for chrome-extension origins

### Can't track products
- Make sure you're logged in
- Check that frontend is running on `http://localhost:3000`
- Verify token is saved in extension storage

### CORS errors
- Backend should allow `chrome-extension://` origins
- Check `Backend/src/index.js` CORS configuration

## Development

### Making Changes
1. Edit files in `ExtensionFrontend/`
2. Go to `chrome://extensions/`
3. Click **refresh icon** on the extension card
4. Test your changes

### Debugging
- **Popup**: Right-click extension icon → "Inspect popup"
- **Background**: `chrome://extensions/` → Click "Service worker" link
- **Console**: Open DevTools and check Console tab

