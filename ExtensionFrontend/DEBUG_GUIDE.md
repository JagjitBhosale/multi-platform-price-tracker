# Extension Debugging Guide

## Issues Fixed:
1. **Track Button Not Showing**: Added automatic token sync before displaying results
2. **My Tracks Empty**: Added better error handling and logging

## How to Debug:

### 1. Check Browser Console
1. Open the extension popup
2. Right-click on the extension popup → Inspect
3. Go to Console tab
4. Look for these messages:
   - `✅ Token synced from frontend tab` - Token successfully synced
   - `Track button shown - user is logged in` - Track button should be visible
   - `Loading tracked products, current token: exists` - Token is available
   - `Found tracks: X` - Number of tracks loaded

### 2. Verify Authentication
1. Make sure you're logged in on `http://localhost:3000`
2. Open browser console (F12) on the frontend page
3. Type: `localStorage.getItem('token')`
4. Should return a JWT token string

### 3. Test Token Sync
1. Open extension popup
2. Open Console (Inspect popup)
3. Type: `chrome.storage.local.get(['token'], (result) => console.log(result))`
4. Should show your token

### 4. Check Backend Connection
1. Make sure backend is running on `http://localhost:5000`
2. In extension console, type:
   ```javascript
   fetch('http://localhost:5000/api/tracking', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
   }).then(r => r.json()).then(console.log)
   ```
3. Should return your tracked products

## Common Issues:

### Issue: "Track button not showing"
**Solution:**
- Make sure you're logged in on frontend (localhost:3000)
- Check if frontend tab is open when extension opens
- Wait a few seconds for token sync (happens every 3 seconds)

### Issue: "My Tracks shows nothing"
**Possible causes:**
1. Not logged in - Check console for "No token found"
2. Backend not running - Check console for fetch errors
3. No tracks - Add a product from Compare tab first
4. Token expired - Try logging out and back in

### Issue: "Can't add product to track"
**Solution:**
- Make sure you see products in Compare tab first
- Track button only shows if:
  - Products are loaded
  - You're logged in (token exists)
  - Extension successfully synced token

## Manual Testing Steps:

1. **Login on Frontend:**
   - Go to http://localhost:3000/auth
   - Login or register
   
2. **Open Extension:**
   - Click extension icon
   - Check console for token sync messages
   
3. **Test Track Button:**
   - Go to Compare tab
   - Visit a product page (Amazon/Flipkart)
   - Track button should appear below products
   
4. **Test My Tracks:**
   - Click "My Tracks" tab
   - Should show your tracked products
   - If empty, add a product first from Compare tab

## Still Not Working?

1. Reload extension in `chrome://extensions/`
2. Close and reopen extension popup
3. Check browser console for errors
4. Verify backend is running: `curl http://localhost:5000/api/tracking`
5. Try logging out and back in on frontend

