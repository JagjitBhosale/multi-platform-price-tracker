# Chrome Extension Setup Guide

## Quick Start

1. **Load Extension:**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `ExtensionFrontend` folder

2. **Start Backend:**
   ```bash
   cd Backend
   npm run dev
   ```

3. **Start Frontend (for login):**
   ```bash
   cd Frontend
   npm run dev
   ```

4. **Use Extension:**
   - Visit a product page on Amazon/Flipkart/Myntra/Reliance
   - Click the extension icon
   - View prices and track products!

## Features

✅ Auto-detect product pages  
✅ Compare prices across all platforms  
✅ Best deal highlight  
✅ Track products  
✅ View tracked products  
✅ Modern, minimalistic UI  

## Authentication Flow

1. Click "Login" in extension
2. Frontend login page opens in new tab
3. Login/Register
4. Token is automatically saved to extension
5. You can now track products

## Icon Setup

Create three PNG files in `ExtensionFrontend/icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

See `icons/ICON_INSTRUCTIONS.md` for details.

## Troubleshooting

- **Extension not loading:** Check all files are in `ExtensionFrontend/` folder
- **Prices not loading:** Ensure backend is running on port 5000
- **CORS errors:** Backend CORS is configured to allow Chrome extensions
- **Can't track:** Make sure you're logged in (token saved in extension storage)

