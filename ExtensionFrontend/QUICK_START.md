# Quick Start Guide

## 🚀 Installation (3 Steps)

### Step 1: Create Icons (2 minutes)

Create three PNG files in `ExtensionFrontend/icons/` folder:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

**Quick Option:** Use a simple blue square with white "P" letter (same as web app logo)

### Step 2: Load Extension (1 minute)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle top-right)
4. Click **"Load unpacked"**
5. Select the `ExtensionFrontend` folder

### Step 3: Start Backend (1 minute)

```bash
cd Backend
npm run dev
```

Make sure it's running on `http://localhost:5000`

## ✅ Ready to Use!

1. **Visit a product page** on Amazon/Flipkart/Myntra/Reliance
2. **Click the extension icon** in Chrome toolbar
3. **View prices** from all platforms
4. **Track products** (requires login)

## 🔐 Login

1. Click "Login" button in extension
2. Opens frontend login page (`http://localhost:3000/auth`)
3. Login/Register
4. Token automatically syncs to extension
5. Now you can track products!

## 📋 Files Structure

```
ExtensionFrontend/
├── manifest.json      ✅ Extension config
├── popup.html        ✅ UI
├── styles.css        ✅ Styling  
├── popup.js          ✅ Main logic
├── content.js        ✅ Content script
├── background.js     ✅ Background worker
├── icons/            ⚠️  Need to add icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          ✅ Documentation
```

## 🎨 Features

- ✅ Auto-detect product pages
- ✅ Compare prices across platforms
- ✅ Best deal highlight
- ✅ Track products
- ✅ View tracked products
- ✅ Modern, minimalistic UI

## ⚠️ Common Issues

**Extension won't load:**
- Check all files exist in `ExtensionFrontend/` folder
- Verify `manifest.json` is valid JSON

**Prices not loading:**
- Make sure backend is running: `cd Backend && npm run dev`
- Check `http://localhost:5000` is accessible

**Can't track products:**
- Click "Login" and login on frontend
- Token should sync automatically

**CORS errors:**
- Backend CORS is already configured for Chrome extensions
- Restart backend if you just updated CORS settings

## 🎯 Next Steps

1. Add custom icons (see `icons/ICON_INSTRUCTIONS.md`)
2. Customize colors/styling in `styles.css`
3. Test on different product pages
4. Pack extension when ready for distribution

