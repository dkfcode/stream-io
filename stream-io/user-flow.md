# StreamGuide User Flow Documentation
**Version:** 2.0  
**Last Updated:** January 17, 2025  
**Status:** Updated to reflect actual implementation state  
**Coverage:** Complete user journey with current limitations noted

---

## ⚠️ **Implementation Status Notice**

**Current State**: This documentation reflects the intended user flow. However, due to missing backend infrastructure, several critical features are **non-functional in the current codebase**:

- ❌ **User Registration/Login** - Supabase backend missing
- ❌ **Email Verification** - Edge functions not deployed  
- ❌ **Watchlist Sync** - Database tables don't exist
- ❌ **Live TV Data** - APIs not configured
- ❌ **User Settings Persistence** - Backend storage missing
- ✅ **Content Browsing** - TMDB integration working
- ✅ **Search** - Basic functionality working
- ✅ **UI Navigation** - Fully functional

---

## 🚀 Application Entry Points

### **First-Time User Journey** (Currently Non-Functional)
```
Landing → Welcome Screen → [BROKEN: Auth Required] → Setup Wizard → Main App
```

### **Returning User Journey** (Currently Non-Functional) 
```
Landing → [BROKEN: Auth Check Fails] → Main App
```

### **Current Working Journey** (Demo Mode)
```
Direct Access → Skip Auth → Main App (Limited Functionality)
```

---

## 🎬 Actual User Journey Flow

### **Phase 1: Application Launch & Initial State**

#### 1.1 Application Entry
- **Entry Point**: User opens application URL
- **Loading State**: 2-second loading screen with StreamGuide branding
- **Current Behavior**: 
  - Auth context initializes but fails silently (no Supabase backend)
  - App continues in "demo mode" without authentication
  - All user-specific features show placeholder data

#### 1.2 Welcome Screen (Working)
- **Trigger**: First-time visit OR `onboardingCompleted` localStorage = false
- **Display Elements**:
  - Animated hero section with floating service logos
  - Feature carousel with 3 slides (drag/touch enabled)
  - "Get Started" button leads to main app
- **Current State**: ✅ Fully functional
- **Note**: Setup wizard accessible but non-functional without backend

#### 1.3 Authentication Modal (Broken)
- **UI State**: Modal displays correctly with all form elements
- **Sign Up Process**: 
  - ❌ Form submission fails (no Supabase backend)
  - ❌ Email verification completely broken
  - ❌ Social login buttons non-functional
- **Sign In Process**:
  - ❌ Credential validation fails
  - ❌ Session management broken
- **Current Workaround**: Users can skip auth and use app in demo mode

---

### **Phase 2: Main Application (Mixed Functionality)**

#### 2.1 Navigation Structure (Working)
```
┌─ Home Tab (TMDB Content Working) ✅
├─ Live Tab (UI Only, No Data) ❌ 
├─ Watchlist Tab (Local Storage Only) ⚠️
├─ Remote Tab (UI Only) ❌
└─ Search Tab (Basic Functionality) ✅
```

#### 2.2 Global UI Elements (Working)
- **Top Navigation**: ✅ Search button, settings gear, profile indicator
- **Bottom Navigation**: ✅ 5-tab system with active states
- **Magic Search Button**: ✅ Floating AI search (basic pattern matching)
- **Toast Notifications**: ✅ System feedback working
- **Settings Panel**: ✅ UI working, no persistence

---

### **Phase 3: Home Tab Experience (Mostly Working)**

#### 3.1 Content Flow (Working)
```
Hero Section → Dynamic Content Sections → Infinite Scroll
```

#### 3.2 Hero Section (Working)
- **Auto-Playing Trailers**: ✅ 30-second rotation working
- **Controls**: ✅ Play/pause, volume, navigation arrows
- **Content Source**: ✅ TMDB trending content
- **Video Integration**: ✅ YouTube trailer embedding
- **Text Overlay**: ✅ Fade animation on video play

#### 3.3 Content Sections (11 Sections - Mixed Status)
1. **Trending Near You** ✅ (TMDB trending)
2. **Curated For You** ⚠️ (Generic trending, no personalization)
3. **Newly Added** ✅ (TMDB latest releases)
4. **Leaving Soon** ❌ (Mock data only)
5. **BingeWorthy** ✅ (TMDB popular TV series)
6. **Because You Like [Genre]** ⚠️ (Shows genres but no user preference)
7. **Top Searches** ❌ (Mock data only)
8. **Top Movies** ✅ (TMDB popular movies)
9. **Top TV Shows** ✅ (TMDB popular TV)
10. **Random Picks** ✅ (TMDB random selection)
11. **Hidden Gems** ⚠️ (Low-rated TMDB content)

#### 3.4 Section Interaction (Working)
- **Collapsed Mode**: ✅ Horizontal scrolling with smooth performance
- **Expanded Mode**: ✅ Full-screen hero view with auto-advance
- **Content Modals**: ✅ Detailed view with streaming platform detection
- **Action Buttons**: ⚠️ UI works, but no data persistence

#### 3.5 Content Modal Experience (Working)
- **Visual Design**: ✅ Blurred poster background, responsive layout
- **Video Integration**: ✅ YouTube trailer autoplay
- **Metadata Display**: ✅ Ratings, runtime, genres, overview
- **Streaming Platforms**: ✅ Real-time availability detection (95% accurate)
- **Action Buttons**: 
  - ❤️ Favorite: ⚠️ Local storage only
  - 🕒 Watch Later: ⚠️ Local storage only  
  - ✅ Watched: ⚠️ Local storage only
  - 🚫 Hide: ❌ Non-functional
  - 📋 Custom Lists: ⚠️ Local storage only

---

### **Phase 4: Search Experience (Basic Functionality)**

#### 4.1 Search Interface (Working)
- **Search Bar**: ✅ Responsive with real-time suggestions
- **Tab Structure**: ✅ Top Results, Movies, TV Shows, Actors
- **Results Display**: ✅ Grid layout with metadata
- **Recent Searches**: ⚠️ Session storage only (no persistence)

#### 4.2 Search Capabilities (Working)
- **Content Search**: ✅ TMDB multi-search working
- **Actor Search**: ✅ Full filmography integration
- **Network Search**: ✅ Brand detection (Disney, Netflix, etc.)
- **Filter Options**: ✅ Media type filtering with result counts
- **AI Search**: ⚠️ Basic pattern matching only (not actual AI)

#### 4.3 Search Results (Working)
- **Content Cards**: ✅ Poster, title, year, rating
- **Actor Results**: ✅ Profile images, known for, popularity
- **Streaming Info**: ✅ Platform availability detection
- **Result Actions**: ⚠️ Same limitations as content modals

---

### **Phase 5: Live Tab Experience (UI Only)**

#### 5.1 Live Tab Structure (Non-Functional)
```
Featured → Browse → TV Guide (3 sub-tabs with no data)
```

#### 5.2 Current State
- **UI Components**: ✅ All tabs and sections render correctly
- **Data Sources**: ❌ No API configurations working
- **Location Services**: ❌ Geolocation works but no data to filter
- **Auto-Refresh**: ❌ Refreshes but no data to update
- **Category Browsing**: ❌ Empty sections
- **Provider Filtering**: ❌ No provider data

#### 5.3 Live Content Display
- **On Now Section**: ❌ Shows "No live content available"
- **Coming Up Section**: ❌ Empty
- **Sports/News/etc**: ❌ All categories empty
- **TV Guide**: ❌ No schedule data

---

### **Phase 6: Watchlist Tab Experience (Local Only)**

#### 6.1 Watchlist Structure (Partially Working)
- **Default Lists**: ✅ Favorite, Watch Later, Watched Already
- **Custom Lists**: ✅ Create/rename/delete (local storage)
- **View Modes**: ✅ List view and Grid view toggle
- **Content Display**: ✅ Saved items display correctly

#### 6.2 Watchlist Limitations
- **Persistence**: ⚠️ Local storage only - no cloud sync
- **Cross-Device**: ❌ No synchronization between devices
- **User-Specific**: ❌ No user authentication to tie lists to
- **Backup**: ❌ No data backup or export functionality

#### 6.3 List Management (Working Locally)
- **Add to List**: ✅ From content modals and search results
- **Remove Items**: ✅ Swipe to delete or context menu
- **Reorder Lists**: ✅ Drag and drop section reordering
- **Search Within Lists**: ✅ Filter functionality working

---

### **Phase 7: Remote Tab Experience (UI Only)**

#### 7.1 Smart TV Remote Interface (Non-Functional)
- **Device Discovery**: ❌ Network scanning not implemented
- **Connection Status**: ❌ Always shows "No devices found"
- **Remote Controls**: ✅ UI fully interactive (buttons, touchpad, keyboard)
- **App Launcher**: ❌ No app detection or launching capability

#### 7.2 Remote Control Types
- **D-Pad Navigation**: ✅ UI responsive but no device communication
- **Touchpad Mode**: ✅ Touch area working but no TV connection
- **Virtual Keyboard**: ✅ Full QWERTY layout but no text transmission
- **Voice Control**: ❌ Not implemented

---

### **Phase 8: Settings & Preferences (Mixed)**

#### 8.1 Settings Panel (Working UI)
- **Account Settings**: ❌ No user account to manage
- **App Settings**: ✅ Theme, language, layout preferences (local storage)
- **Streaming Services**: ✅ Service selection (local storage)
- **Privacy Settings**: ✅ UI working but no backend privacy controls
- **Notifications**: ❌ No notification system implemented

#### 8.2 Preferences System (Local Only)
- **Genre Selection**: ✅ Working locally
- **Streaming Services**: ✅ Working locally  
- **TV Providers**: ✅ Working locally
- **Language/Region**: ✅ Working with i18n system
- **Theme**: ✅ Dark/light mode working

---

## 🔧 Technical Implementation Details

### Current Data Flow
```
User Action → Local State → UI Update
            ↓
    [Missing: Backend Sync]
```

### Working Data Sources
- **TMDB API**: ✅ Movies, TV shows, actors, images, videos
- **Local Storage**: ✅ Preferences, watchlists, search history
- **Session Storage**: ✅ Temporary UI state

### Missing Data Sources
- **Supabase**: ❌ User accounts, persistent data, real-time sync
- **Live TV APIs**: ❌ Program schedules, live events
- **Smart TV APIs**: ❌ Device discovery, remote control
- **Analytics**: ❌ User behavior tracking

---

## 📱 Platform-Specific Behaviors

### **Desktop Experience**
- **Navigation**: Mouse hover effects, keyboard shortcuts
- **Modals**: Click outside to close, ESC key support
- **Scrolling**: Mouse wheel and scroll bars
- **Performance**: Optimized for larger screens

### **Mobile Experience** 
- **Navigation**: Touch-friendly tap targets (44px minimum)
- **Modals**: Swipe gestures, mobile-optimized layouts
- **Scrolling**: Touch scrolling with momentum
- **Performance**: Lazy loading for mobile data plans

### **Tablet Experience**
- **Navigation**: Hybrid touch/keyboard support
- **Layout**: Responsive grid adjustments
- **Orientation**: Landscape/portrait mode handling
- **Performance**: Medium-optimized assets

---

## 🚨 Current Limitations & Workarounds

### Authentication Workarounds
- **User Flow**: Skip auth, use app in demo mode
- **Persistence**: Local storage for all user data
- **Session**: Browser session only (no cross-device)

### Live TV Workarounds
- **Content**: Show static "coming soon" messaging
- **Data**: Use mock data for development/demo
- **Features**: Disable live-specific functionality

### Watchlist Workarounds
- **Sync**: Encourage users to use single device
- **Backup**: Provide manual export/import functionality
- **Sharing**: Not possible without user accounts

### Smart TV Workarounds
- **Discovery**: Show setup instructions for manual connection
- **Control**: Focus on web-based remote apps
- **Integration**: Phase 2 feature with proper protocols

---

## 📋 User Journey Success Criteria

### ✅ Currently Achievable
- User can browse and discover content
- User can search for movies/TV shows/actors
- User can view detailed content information
- User can manage local watchlists
- User can customize basic preferences

### ❌ Not Currently Achievable
- User cannot create persistent account
- User cannot sync data across devices
- User cannot access live TV information
- User cannot control smart TV devices
- User cannot receive personalized recommendations (no user history)

---

## 🔄 Post-Backend Implementation Changes

Once backend infrastructure is implemented, the user flow will change significantly:

### Enhanced Authentication Flow
```
Landing → Welcome → Sign Up → Email Verification → Onboarding → Authenticated App
```

### Enhanced Data Persistence
```
User Action → Local State → Backend Sync → UI Update
            ↓              ↓
    Local Storage ← → Supabase Database
```

### Enhanced Features
- Real-time watchlist sync across devices
- Personalized recommendations based on user history  
- Live TV schedules and events
- User-specific settings and preferences
- Cross-device session management

---

**Current Recommendation**: Focus on backend implementation before marketing or user acquisition. The app provides good content discovery but lacks the persistence and personalization needed for production use.

**Next Update**: February 1, 2025 (after backend implementation)

