# Google Maps Setup Guide

## Problem: ApiNotActivatedMapError

You have a valid Google Maps API key, but the required APIs are not enabled. Here's how to fix it:

## Step-by-Step Solution

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/library

### 2. Enable Required APIs
Search for and enable each of these APIs:

- **Maps JavaScript API** - Required for the interactive map
- **Street View Static API** - Required for street view images  
- **Geocoding API** - Required to convert addresses to coordinates
- **Places API** - Required for address validation

### 3. For Each API:
1. Click on the API name
2. Click "ENABLE" button
3. Wait for activation (usually takes 1-2 minutes)

### 4. Verify API Key Restrictions (Optional but Recommended)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under "API restrictions", select "Restrict key"
4. Choose the 4 APIs listed above
5. Save changes

### 5. Restart Development Server
After enabling the APIs, restart your development server:
```bash
cd /Users/Mike/Desktop/rezio-new/web
pnpm dev
```

## Current Status
- ✅ API Key: Valid
- ❌ APIs: Not all enabled
- 🔄 Action Required: Enable the 4 APIs listed above

## Direct Links
- [Enable Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
- [Enable Street View API](https://console.cloud.google.com/apis/library/street-view-image-backend.googleapis.com)
- [Enable Geocoding API](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com)
- [Enable Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)

Once all APIs are enabled, the Street View and Property Map with setback overlays will work perfectly!