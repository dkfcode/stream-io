# Streaming Service Logos

This directory contains locally hosted logo images for streaming services to ensure reliability and prevent broken images from external sources.

## File Structure

Each streaming service should have the following files:
```
logos/
├── apple-tv/
│   ├── logo.png (primary logo)
│   ├── icon.png (square icon version)
│   └── favicon.ico (small icon)
├── netflix/
│   ├── logo.png
│   ├── icon.png
│   └── favicon.ico
├── disney-plus/
│   ├── logo.png
│   ├── icon.png
│   └── favicon.ico
└── ... (other services)
```

## Image Requirements

- **Primary Logo** (`logo.png`): 256x256px or larger, transparent background preferred
- **Icon** (`icon.png`): 128x128px, square format, suitable for small displays
- **Favicon** (`favicon.ico`): 32x32px or 64x64px, for minimal fallback

## Download Instructions

### Apple TV+
- Primary: https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/AppleTVLogo.svg/2048px-AppleTVLogo.svg.png
- Fallback: https://tv.apple.com/favicon.ico

### Netflix
- Primary: https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico
- Fallback: https://logos-world.net/wp-content/uploads/2020/04/Netflix-Logo.png

### Disney+
- Primary: https://m.media-amazon.com/images/I/719t3jd2NeL.png
- Fallback: https://logos-world.net/wp-content/uploads/2020/11/Disney-Plus-Logo.png

### Prime Video
- Primary: https://m.media-amazon.com/images/I/31W9hs7w0JL.png
- Fallback: https://logos-world.net/wp-content/uploads/2020/04/Amazon-Prime-Logo.png

### Hulu
- Primary: https://play-lh.googleusercontent.com/4whGAVjZGrrlNxzheKAfBXrxggtyAb4euWLeQI8fDfVfdnFEZjE0DZTJ8DKoh64pqcIa=w240-h480-rw
- Fallback: https://logos-world.net/wp-content/uploads/2020/05/Hulu-Logo.png

### Max (HBO Max)
- Primary: https://cdn6.aptoide.com/imgs/4/2/d/42dc60380274e539015fbdbcabb4f44e_icon.png
- Fallback: https://logos-world.net/wp-content/uploads/2022/04/HBO-Max-Logo.png

### Peacock
- Primary: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjnxsp3Q-Q11wjcwRIFz0xY4QXE5YEvibpbQ&s
- Fallback: https://logos-world.net/wp-content/uploads/2020/07/Peacock-Logo.png

### Paramount+
- Primary: https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/66/e7/22/66e722b3-1817-18a2-c1b9-84c86ffbe85c/P_U002bAppIcon-1x_U007emarketing-0-7-0-85-220-0.png/1024x1024.jpg
- Fallback: https://logos-world.net/wp-content/uploads/2021/02/Paramount-Plus-Logo.png

## Optimization

After downloading, optimize the images:
- Convert to WebP format for better compression
- Ensure consistent sizing across logos
- Remove unnecessary metadata
- Test in both light and dark themes

## Usage

Import logos using:
```typescript
import appleTvLogo from '../assets/images/logos/apple-tv/logo.png';
``` 