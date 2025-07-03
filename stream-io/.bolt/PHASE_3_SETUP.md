# 🚀 StreamGuide Phase 3 Setup Guide
**AI & TV Integration - January 2025**

---

## 🎯 **Phase 3 Overview**

Phase 3 brings powerful AI and live TV capabilities to StreamGuide:
- **✨ Gemini 2.5 Pro AI Integration** - Smart search interpretation and personalized recommendations
- **📺 Live TV Data Integration** - Real-time channel schedules and programming
- **🧠 Enhanced Search Experience** - Natural language query processing
- **🎭 Personalized Content Discovery** - AI-powered recommendations

---

## 🔑 **Required API Keys**

### **1. Gemini AI (Google AI Studio) - FREE** ⭐ **PRIORITY**
- **Purpose**: Powers AI search interpretation and personalized recommendations
- **Cost**: FREE with generous limits (60 req/min, 300K tokens/day)
- **Students**: Unlimited until June 30, 2026!

**How to Get Your Free API Key:**
1. Visit: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the 40-character key
5. **Students**: Click "Verify with Student ID" for unlimited access

### **2. TMDB (Required for Content Data)**
- **Purpose**: Movie and TV show metadata
- **Cost**: FREE
- **Get it**: [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

### **3. Live TV APIs (Optional - Start with Free Tier)**
- **TVMaze API**: FREE, no key required
- **EPG.best**: Good free tier, optional paid upgrade
- **Gracenote**: Premium (for future enterprise use)

---

## ⚙️ **Environment Configuration**

### **Step 1: Create Environment File**
Create `.env.local` in your project root:

```bash
# StreamGuide Phase 3 Configuration

# === CORE APPLICATION ===
VITE_APP_URL=http://localhost:5173
VITE_APP_DOMAIN=localhost

# === REQUIRED: TMDB (Movie/TV Data) ===
VITE_TMDB_ACCESS_TOKEN=your_tmdb_token_here

# === PHASE 3: GEMINI AI (FREE) ===
VITE_GOOGLE_AI_API_KEY=your_gemini_api_key_here

# === OPTIONAL: GOOGLE CLOUD (Enterprise) ===
VITE_GOOGLE_CLOUD_PROJECT_ID=streamguide-ai
VITE_GOOGLE_CLOUD_LOCATION=us-central1
VITE_GEMINI_MODEL=gemini-2.0-flash-exp

# === OPTIONAL: LIVE TV PROVIDERS ===
VITE_EPG_API_KEY=your_epg_key_here
VITE_GRACENOTE_API_KEY=your_gracenote_key_here

# === DEVELOPMENT ===
VITE_DEV_MODE=true
VITE_DEBUG=true
```

### **Step 2: Quick Start Setup**
```bash
# 1. Install dependencies (if not done)
npm install

# 2. Add your API keys to .env.local
# (Copy template above and fill in your keys)

# 3. Start development server
npm run dev

# 4. Test AI features in the app
# - Use the Magic Search button (floating AI icon)
# - Try natural language searches like "funny movies from the 90s"
# - Check personalized recommendations
```

---

## 🧪 **Testing Phase 3 Features**

### **1. AI Search Testing**
Once your Gemini API key is configured:

**Test Queries:**
- "Show me funny movies from the 90s"
- "I want something scary but not too violent" 
- "Find action movies like John Wick"
- "What should I watch tonight?"

**Expected Behavior:**
- ✅ Smart interpretation of vague queries
- ✅ Genre-based recommendations
- ✅ Personalized suggestions
- ✅ Natural language responses

### **2. Live TV Testing** 
**Without API Keys (Fallback Mode):**
- Navigate to Live tab
- Should show realistic mock data
- Channel schedules display current/upcoming programs

**With TV APIs Configured:**
- Real-time channel data
- Accurate programming schedules
- Live event information

### **3. Personalized Recommendations**
- Visit Home tab
- Sections should adapt based on preferences
- AI-generated "Because you like..." sections
- Smart content curation

---

## 🔍 **Verification Checklist**

### **✅ AI Features Working**
- [ ] Magic Search button responds to natural language
- [ ] Search results include AI interpretation
- [ ] Personalized sections appear on homepage
- [ ] AI confidence scores displayed
- [ ] Fallback mode works when API unavailable

### **✅ Live TV Features**
- [ ] Live tab loads without errors
- [ ] Channel schedules display (mock or real data)
- [ ] Channel categories work (News, Sports, Entertainment)
- [ ] Time-based filtering functions

### **✅ Performance & Integration**
- [ ] App starts up normally
- [ ] No console errors related to AI services
- [ ] API rate limits respected
- [ ] Graceful fallback to mock data

---

## 💡 **Phase 3 Feature Highlights**

### **🎭 Smart Search Interpretation**
```
User: "something funny for date night"
AI: "Looking for romantic comedies perfect for couples! 
     Here are some crowd-pleasing options..."
```

### **📊 Personalized Discovery**
- AI analyzes your viewing preferences
- Suggests content based on mood and time
- Cross-platform availability detection
- Hidden gems recommendations

### **📺 Live TV Intelligence**
- Real-time programming schedules
- Sports event detection
- News segment awareness
- Show reminder capabilities

---

## 🚨 **Troubleshooting**

### **"Gemini service not configured" Error**
```bash
# Check your .env.local file
cat .env.local | grep VITE_GOOGLE_AI_API_KEY

# Restart development server
npm run dev
```

### **AI Search Returns Basic Results**
- ✅ Check if Gemini API key is valid
- ✅ Verify API key has no billing issues
- ✅ Check browser console for API errors
- ✅ Fallback mode should still work

### **Live TV Shows "No Data Available"**
- ✅ Expected behavior without TV API keys
- ✅ Mock data should display for testing
- ✅ Add EPG.best key for real data

---

## 📈 **API Usage & Limits**

### **Gemini AI Studio (FREE Tier)**
- **Rate Limit**: 60 requests/minute
- **Daily Limit**: 300,000 tokens
- **Context Window**: 1 million tokens
- **Cost**: $0.00

### **Student Benefits** 
- **Unlimited tokens** until June 30, 2026
- **Verify at**: aistudio.google.com/app/apikey
- **Required**: Valid student ID

### **Future Scaling**
- Enterprise: Vertex AI with billing
- Production: Rate limit increases available
- Monitoring: Built-in usage tracking

---

## 🎯 **Next Steps After Phase 3**

### **Phase 4 - Production Deployment**
- Coolify deployment with environment variables
- Database migration for user preferences
- Performance optimization
- Security hardening

### **Enhanced Features**
- Voice search integration
- Advanced recommendation algorithms
- Cross-device synchronization
- Premium API integrations

---

## 🆘 **Support & Resources**

### **Official Documentation**
- [Google AI Studio Guide](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api)
- [TMDB API Docs](https://developers.themoviedb.org/3)

### **Community Support**
- [Google AI Forum](https://discuss.ai.google.dev/)
- [StreamGuide Issues](./issues-tracker.md)

### **Quick Links**
- 🔑 [Get Gemini API Key](https://aistudio.google.com/app/apikey)
- 🎬 [Get TMDB API Key](https://www.themoviedb.org/settings/api)
- 📺 [EPG.best API](https://epg.best/)

---

**🎉 Ready to experience the future of streaming discovery with AI!**

*Last updated: January 17, 2025* 