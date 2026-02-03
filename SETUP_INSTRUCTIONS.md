# PriceCompare - Setup Instructions

## Overview
This is a price comparison application that allows users to:
- Compare product prices across Amazon, Flipkart, Myntra, and Reliance Digital
- Track products and get notified when prices drop
- Save favorite products for monitoring

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a `.env` file in the `Backend` directory with the following variables:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pricecompare?retryWrites=true&w=majority

# Google Gemini AI API Key
GOOGLE_API_KEY=your_google_api_key_here

# JWT Secret for authentication
JWT_SECRET=your_random_jwt_secret_here

# JWT Expiration (optional, default is 30d)
JWT_EXPIRE=30d
```

### 4. MongoDB Atlas Setup
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (choose the free tier)
4. Create a database user
5. Add your IP address to the whitelist (0.0.0.0/0 for development)
6. Get your connection string from "Connect" > "Connect your application"
7. Replace `<password>` with your actual password
8. Update the `MONGODB_URI` in your `.env` file

### 5. Google Gemini API Key
1. Go to https://aistudio.google.com/
2. Create a new API key
3. Copy the API key to your `.env` file

### 6. Run the Backend Server
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd Frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Frontend
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

### 1. User Authentication
- **Register**: Create a new account with email, password, and optional contact info
- **Login**: Sign in with existing credentials
- **Logout**: Sign out from your account

### 2. Product Search & Comparison
- Search by product name or paste a product link
- View prices across multiple platforms
- See ratings, discounts, and offers
- Best deal banner highlights the cheapest option

### 3. Product Tracking (Authenticated Users Only)
- Click "Track This Product" to save a product for monitoring
- View all tracked products in "My Tracks" page
- Get notifications when prices drop (via email/WhatsApp)
- Track price history across all platforms

### 4. My Tracks Page
- View all products you're tracking
- See current prices across all platforms
- Track best deals automatically
- Delete products you no longer want to track

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Tracking
- `GET /api/tracking` - Get all tracked products (protected)
- `POST /api/tracking` - Add a product to track (protected)
- `PUT /api/tracking/:id` - Update tracked product (protected)
- `DELETE /api/tracking/:id` - Delete tracked product (protected)

### Scraping
- `POST /api/aggregate-scrape` - Get prices from all platforms

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Puppeteer (web scraping)
- Google Gemini AI
- JWT authentication
- bcryptjs (password hashing)

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Radix UI / Shadcn UI
- SWR (data fetching)
- Sonner (toast notifications)

## Project Structure

```
LionelAgency/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── trackingController.js
│   │   │   ├── amazonProductScrapper.js
│   │   │   └── ... (other scrapers)
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── TrackedProduct.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── trackingRoutes.js
│   │   │   └── aggregateScrapper.js
│   │   └── index.js
│   └── .env
│
└── Frontend/
    ├── app/
    │   ├── page.tsx             # Main search page
    │   ├── auth/
    │   │   └── page.tsx         # Login/Register
    │   ├── tracks/
    │   │   └── page.tsx         # My Tracks page
    │   └── api/
    │       ├── aggregate/
    │       │   └── route.ts
    │       ├── auth/
    │       │   └── route.ts
    │       └── tracking/
    │           └── route.ts
    ├── components/
    │   ├── price-compare/
    │   └── ui/
    ├── contexts/
    │   └── AuthContext.tsx
    └── lib/
        └── utils.ts
```

## Next Steps

### For Production
1. Set up environment variables in production
2. Configure CORS for your domain
3. Set up email/WhatsApp notification service
4. Add scheduled jobs to update tracked product prices
5. Implement rate limiting
6. Add monitoring and logging

### To Add Email/WhatsApp Notifications
You'll need to implement notification services in the backend:
1. Use Nodemailer for email notifications
2. Use Twilio for WhatsApp notifications
3. Create a scheduled job to check price changes
4. Send notifications when price drops

## Troubleshooting

### Backend won't start
- Check if MongoDB connection string is correct
- Ensure GOOGLE_API_KEY is set
- Make sure port 5000 is available

### Frontend won't start
- Check if dependencies are installed
- Ensure port 3000 is available
- Clear `.next` cache if needed

### Authentication not working
- Check JWT_SECRET is set in backend .env
- Verify MongoDB connection
- Check browser console for errors

## Support
For issues or questions, check the console logs for detailed error messages.

