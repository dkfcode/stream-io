# 🎬 StreamGuide
*Your Ultimate AI-Powered Streaming Companion & Content Discovery Platform*

StreamGuide is a sophisticated, modern streaming companion that revolutionizes how you discover, manage, and enjoy entertainment content across the digital landscape. Built with cutting-edge web technologies, it offers personalized recommendations, intelligent search capabilities, real-time live TV integration, smart remote control functionality, and comprehensive content management in one elegant, responsive platform.

---

## 🚀 Tech Stack & Architecture

### Frontend Technologies
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool for fast development and optimized production builds
- **Tailwind CSS** for utility-first styling with custom design system
- **Framer Motion** for smooth animations and transitions
- **React Hot Toast** for elegant notification system
- **Lucide React** for consistent iconography

### State Management & Data
- **Zustand** for lightweight, performant state management (watchlist functionality)
- **React Query (@tanstack/react-query)** for server state management and caching
- **React Context API** for app-wide state (Auth, Settings, Theme, Preferences)
- **Local Storage** for persistent user preferences and offline data

### Backend & Services
- **Supabase** for authentication, database, and edge functions
- **TMDB API** for comprehensive movie and TV show data
- **Custom Live Events API** for real-time programming information
- **Location Services** for geographically-aware content discovery

### Development Tools
- **ESLint** with TypeScript rules for code quality
- **PostCSS** with Autoprefixer for CSS processing
- **TypeScript 5.5+** for enhanced type safety
- **Environment Variables** for secure configuration management

---

## ✨ Core Features Overview

### 🔐 **Authentication System**
- **Email/Password Authentication** with Supabase backend
- **Email Verification** with 4-digit verification codes
- **Custom Verification Flow** with 10-minute expiration and attempt limiting
- **Password Reset** and update functionality
- **Session Management** with automatic token refresh
- **Protected Routes** and authenticated user states

### 🏠 **Personalized Home Experience**
The home dashboard showcases intelligent content curation with multiple dynamic sections:

**Dynamic Hero Section**
- Rotating showcase of trending content with immersive video trailers
- Interactive playback controls with volume management and text overlays
- Smart trailer autoplay with fade-out text for immersive viewing
- Manual slide navigation with touch/drag support for mobile devices
- Automatic pause when other sections are expanded to prevent interference

**AI-Driven Content Sections**
- **"For You"** - Personalized recommendations based on viewing history and preferences
- **"Trending Near You"** - Location-aware trending content with real-time data
- **"Because You Added X"** - Smart recommendations based on latest watchlist additions
- **Dynamic Genre Carousels** - Sections for each selected genre with curated content
- **Platform-Specific Collections** - Content from connected streaming services

**Curated Content Categories**
- **BingeWorthy** - Perfect series for extended viewing sessions
- **Newly Added** - Fresh content across platforms with addition dates
- **Leaving Soon** - Time-sensitive viewing opportunities with expiration alerts
- **Top Searches** - Community-driven trending discoveries
- **Random Picks** - Serendipitous content discovery for adventurous viewers

### 🔍 **Advanced Search & Discovery Engine**

**Intelligent Multi-Tab Search Interface**
- **Top Results** - Combined results showing the most relevant content across all categories
- **Movies** - Dedicated movie search with enhanced filtering
- **TV Shows** - Television content with series-specific metadata
- **Actors** - Actor/celebrity search with full filmography integration

**Network & Brand Intelligence**
- Searches for "Disney", "HBO", "Marvel", "NBC" return brand-specific content libraries
- 25+ supported networks including Disney+, Netflix, HBO, ABC, NBC, MTV, Comedy Central
- Hybrid results combining network content with general search results
- Smart brand detection and content consolidation

**Enhanced Search Features**
- **Visual Recent Searches** - Thumbnail-based search history with release years
- **Real-time Suggestions** - Debounced search with intelligent caching (300ms delay)
- **Multi-source Results** - Combines trending data, actor filmographies, and network catalogs
- **Advanced Filtering** - Filter results by content type with dynamic result counts
- **30-Day Search History** - Persistent search history with easy management and clearing

### 🎭 **Comprehensive Actor & Filmography System**

**Complete Actor Detail Pages**
- **Hero Section** - Actor profile with gradient backdrop and professional headshots
- **Career Statistics** - Known for department, popularity metrics, and career highlights
- **Complete Filmography** - Separate sections for movies and TV shows with horizontal scrolling
- **Smart Content Sorting** - Popularity-based sorting with release date fallbacks

**Interactive Filmography Browsing**
- **Dual Section Layout** - Movies and TV shows displayed as separate horizontal scrolling sections
- **Enhanced Poster Interactions** - Hover effects with ratings, years, and quick action buttons
- **Play, Watchlist, and Info Buttons** - Direct actions from filmography posters
- **Auto-Expanding Hero Mode** - Full-screen filmography browsing with trailer integration
- **Seamless Navigation** - Smooth transitions between search, actor pages, and content modals

### 📺 **Real-Time Live TV & Events Hub**

**Location-Aware Live Programming**
- **Automatic IP-based Geolocation** - Accurate local content based on actual location
- **DMA Code Integration** - Precise regional programming and channel lineups
- **Manual Location Override** - Correction system for location accuracy
- **Timezone Synchronization** - All programming times adjusted to local timezone

**Comprehensive Live Event Categories**
- **Sports** - Live games with real-time scores, team matchups, and league information
- **News** - Breaking news coverage with local and national programming
- **Awards Shows** - Red carpet events, ceremonies, and entertainment awards
- **Reality TV** - Competition shows, dating shows, and reality programming
- **Game Shows** - Interactive entertainment and quiz programming
- **Music Events** - Concerts, festivals, and live music performances

**Advanced Live Features**
- **Auto-refresh Every 2 Minutes** - Real-time accuracy for live programming changes
- **Provider Filtering** - Show only content from selected TV providers
- **Collapsible Category Organization** - Organized browsing by event type
- **Live/Upcoming Status Indicators** - Clear distinction between current and upcoming events
- **Viewer Count Estimates** - Real-time viewership statistics for live events

### 📋 **Advanced Watchlist Management System**

**Multi-List Architecture with Custom Organization**
- **Default Lists** - Pre-configured Favorite, Watch Later, and Watched Already lists
- **Unlimited Custom Lists** - Create as many lists as needed with custom naming
- **Section-Based Layout** - Each list displayed as an individual expandable section
- **Dual View Modes** - Toggle between List View (detailed cards) and Grid View (thumbnail grid)

**Advanced List Management**
- **Streaming Service Detection** - Real-time availability checking across platforms
- **Content Filtering** - Filter by media type (movies/TV) across all lists simultaneously
- **Recent Activity Tracking** - Powers "Because You Added X" personalized recommendations
- **Hero-Style Expanded View** - Full-screen browsing with trailer integration and auto-advance
- **Interactive Thumbnails** - Click to open modals in collapsed mode, navigate slides in expanded mode

**Smart Integration Features**
- **Cross-Platform Availability** - Shows where content is currently available to watch
- **Deep Linking to Services** - Direct links to streaming platforms for immediate viewing
- **Recommendation Engine Integration** - Watchlist activity influences home page suggestions
- **Persistent Storage** - All lists saved locally with automatic synchronization

### 📱 **Smart TV Remote Control System**

**Universal Remote Functionality**
- **Network Scanning** - Automatic discovery of compatible smart TVs on network
- **Multi-TV Support** - Manage and control multiple TVs throughout home
- **Connection Status Monitoring** - Real-time connection status and last-seen timestamps
- **Manual TV Addition** - Add TVs by IP address for custom configurations

**Advanced Remote Controls**
- **Traditional D-Pad Navigation** - Responsive directional controls with visual feedback
- **Drag-Based Navigation** - Intuitive drag gestures for smooth TV navigation
- **Voice Control Ready** - Infrastructure for voice command integration
- **Power Management** - TV power on/off with status indicators
- **Volume Controls** - Fine-tuned volume adjustment with mute functionality

**Modern Interaction Methods**
- **Touchpad Mode** - Touch-sensitive area for cursor-based navigation
- **Virtual Keyboard** - Full QWERTY keyboard for text input and search
- **App Launcher Grid** - Visual app selection with installed app detection
- **Quick Action Buttons** - Home, back, menu, and media control buttons

### 🎬 **Enhanced Content Modals & Interaction**

**Immersive Movie/TV Show Modals**
- **Blurred Poster Background** - Dynamic backdrop using content's poster image
- **Trailer Integration** - YouTube trailer embedding with autoplay functionality
- **Comprehensive Metadata** - Release dates, ratings, runtime, genres, and overview
- **Streaming Platform Pills** - Compact buttons showing where content is available to watch
- **Smart Action Buttons** - Favorite, Watch Later, Watched Already, and custom list additions
- **Optimized Layout** - Compact design that fits entirely on screen without scrolling
- **Responsive Design** - Adapts beautifully across mobile, tablet, and desktop devices

**Advanced Content Details**
- **Multiple Streaming Sources** - Platform consolidation and direct streaming links
- **Rating Information** - TMDB ratings and popularity metrics
- **Similar Content Suggestions** - Related movies and shows based on viewing patterns
- **Cast and Crew Information** - Quick access to actor filmographies
- **Genre and Category Tags** - Easy content classification and discovery

---

## 🛠 **Installation & Setup**

### Prerequisites
- Node.js 16+ and npm/yarn
- Supabase account and project
- TMDB API key

### Environment Configuration

**Quick Setup:**
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your actual values
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
- `VITE_TMDB_ACCESS_TOKEN` - TMDB API access token ([Get yours here](https://www.themoviedb.org/settings/api))
- `VITE_SUPABASE_URL` - Your Supabase project URL  
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Optional Variables:**
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Application port (default: 3000)
- `VITE_APP_DOMAIN` - Your application domain
- `VITE_DEV_MODE` - Enable development features
- `VITE_DEBUG` - Enable debug logging

> 📋 **Complete setup guide:** See `ENVIRONMENT_SETUP.md` for detailed configuration instructions

**Example .env file:**
```env
VITE_TMDB_ACCESS_TOKEN=your_tmdb_access_token_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NODE_ENV=development
PORT=3000
```

### Installation Commands

```bash
# Clone the repository
git clone [repository-url]
cd stream_guide_v1

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

**Using Docker Compose (Recommended):**
```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env with your actual values

# 2. Production deployment
docker-compose up -d

# 3. Development with hot reload
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

**Manual Docker Build:**
```bash
# Build with environment variables
docker build \
  --build-arg VITE_TMDB_ACCESS_TOKEN=your_token \
  --build-arg VITE_SUPABASE_URL=your_url \
  --build-arg VITE_SUPABASE_ANON_KEY=your_key \
  --build-arg VITE_APP_DOMAIN=your_domain \
  -t streamguide .

# Run the container
docker run -p 3000:3000 streamguide
```

**Docker Features:**
- ✅ Multi-stage builds for optimized production images
- ✅ Non-root user for enhanced security
- ✅ Health checks for container monitoring  
- ✅ Environment variable injection at build time
- ✅ Resource limits and security configurations
- ✅ Development override for hot reload

### Database Setup
1. Set up Supabase project with provided SQL migrations
2. Enable email authentication in Supabase dashboard
3. Configure SMTP settings for email verification
4. Deploy edge functions for verification system

---

## 📁 **Project Structure**

```
src/
├── components/           # React components
│   ├── live/            # Live events components
│   ├── settings/        # Settings panel components
│   ├── MovieModal.tsx   # Content detail modals
│   ├── SearchBar.tsx    # Advanced search system
│   ├── WatchlistContent.tsx # Watchlist management
│   └── ...
├── contexts/            # React Context providers
│   ├── AuthContext.tsx  # Authentication state
│   ├── PreferencesContext.tsx # User preferences
│   ├── SettingsContext.tsx # App settings
│   └── ThemeContext.tsx # Theme management
├── services/            # API and external services
│   ├── tmdb.ts          # TMDB API integration
│   ├── liveEventsApi.ts # Live programming data
│   ├── authService.ts   # Authentication services
│   └── locationService.ts # Geolocation services
├── store/               # State management
│   └── watchlistStore.ts # Zustand store for watchlists
├── types/               # TypeScript type definitions
├── lib/                 # Utility libraries
└── data/                # Static data and configurations
```

---

## 🎯 **Key Features Implementation Details**

### Authentication Flow
- Supabase-powered authentication with email verification
- Custom 4-digit verification codes with 10-minute expiration
- Edge functions for secure email sending and verification
- Protected routes and session management

### Real-time Live Events
- Integration with TV guide services for accurate programming data
- Location-based content filtering using IP geolocation
- Provider-specific channel mapping and streaming URLs
- Auto-refreshing live data every 2 minutes

### Advanced Search System
- Debounced search with 300ms delay for performance
- Multi-source result aggregation (TMDB, trending, networks)
- Visual search history with thumbnail previews
- Brand-aware search for network-specific content

### Watchlist Management
- Zustand-powered state management for performance
- Multiple list support with default and custom lists
- Hero-style expanded views with trailer integration
- Cross-platform availability detection

### Smart TV Remote
- Network discovery using WebRTC and local network scanning
- Multi-device support with connection state management
- Virtual input methods including touchpad and keyboard
- App launcher with real-time TV app detection

---

## 🚀 **Development Guidelines**

### Code Organization
- Component-based architecture with TypeScript
- Custom hooks for reusable logic
- Context providers for global state
- Service layers for external API integration

### Styling Approach
- Tailwind CSS utility classes
- Custom design system with consistent spacing
- Responsive design with mobile-first approach
- Dark theme with purple accent colors

### Performance Optimizations
- React Query for efficient data caching
- Lazy loading for large components
- Debounced search and user inputs
- Optimized image loading and responsive images

### Testing & Quality
- ESLint configuration for code quality
- TypeScript for type safety
- Error boundaries for graceful error handling
- Toast notifications for user feedback

---

## 📱 **Responsive Design**

StreamGuide is built with a mobile-first approach:

- **Mobile (320px+)**: Optimized touch interfaces, collapsible navigation
- **Tablet (768px+)**: Enhanced grid layouts, expanded search results
- **Desktop (1024px+)**: Full feature set, multiple columns, hover interactions
- **Large Screens (1440px+)**: Maximum content density, advanced layouts

---

## 🔧 **Configuration & Customization**

### Theme Customization
- CSS custom properties for easy color scheme changes
- Tailwind configuration for design system tokens
- Dark/light theme support infrastructure

### Content Sources
- TMDB API for comprehensive movie/TV data
- Custom live events API for real-time programming
- Geolocation services for regional content
- Streaming platform integration points

### User Preferences
- Onboarding flow for initial setup
- Persistent settings storage
- Customizable content filters
- Personal watchlist organization

---

## 🎬 **StreamGuide in Action**

StreamGuide transforms the way users discover and manage their entertainment:

1. **Discover** content through intelligent search and personalized recommendations
2. **Organize** favorites and watchlists with flexible list management
3. **Track** what's trending and newly available across platforms
4. **Watch** live events and programming with real-time updates
5. **Control** smart TVs with modern remote functionality
6. **Enjoy** immersive content browsing with trailers and detailed information

Built for the modern streaming landscape, StreamGuide consolidates multiple entertainment platforms into one powerful, intuitive interface that adapts to each user's viewing habits and preferences. 