// StreamGuide Trailer Troubleshooting Script
// Run this in your browser console on the Coolify domain

console.log('🎬 StreamGuide Trailer Diagnostic Tool');
console.log('=====================================');

// Check environment variables
console.log('🔧 Environment Variables:');
console.log('  VITE_TMDB_ACCESS_TOKEN:', import.meta.env.VITE_TMDB_ACCESS_TOKEN ? 
  `✅ SET (${import.meta.env.VITE_TMDB_ACCESS_TOKEN.substring(0, 20)}...)` : 
  '❌ NOT SET');

console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL || '❌ NOT SET');
console.log('  VITE_APP_URL:', import.meta.env.VITE_APP_URL || '❌ NOT SET');

// Check if we can access TMDB API
console.log('\n🔍 Testing TMDB API Access:');

if (import.meta.env.VITE_TMDB_ACCESS_TOKEN) {
  // Test with a popular movie (Fight Club - ID: 550)
  fetch('https://api.themoviedb.org/3/movie/550/videos', {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_TMDB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ TMDB API Response:', data);
    
    if (data.results && data.results.length > 0) {
      const trailers = data.results.filter(video => 
        video.site === 'YouTube' && 
        (video.type === 'Trailer' || video.type === 'Teaser') &&
        video.official
      );
      
      if (trailers.length > 0) {
        console.log('✅ Found trailers:', trailers.length);
        console.log('🎬 Sample trailer URL:', `https://www.youtube.com/embed/${trailers[0].key}`);
      } else {
        console.log('⚠️ No trailers found in response');
      }
    } else {
      console.log('⚠️ No videos found in response');
    }
  })
  .catch(error => {
    console.error('❌ TMDB API Error:', error);
    console.log('💡 Common causes:');
    console.log('   - Invalid or expired TMDB token');
    console.log('   - Network connectivity issues');
    console.log('   - CORS or security policy blocking request');
  });
} else {
  console.log('❌ Cannot test TMDB API - token not available');
  console.log('💡 Solution: Set VITE_TMDB_ACCESS_TOKEN in Coolify environment variables');
}

// Check for YouTube iframe support
console.log('\n🎥 Testing YouTube Embed Support:');

// Create test iframe
const testIframe = document.createElement('iframe');
testIframe.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0';
testIframe.style.display = 'none';
document.body.appendChild(testIframe);

setTimeout(() => {
  try {
    if (testIframe.contentWindow) {
      console.log('✅ YouTube iframe support available');
    } else {
      console.log('⚠️ YouTube iframe may be restricted');
    }
  } catch (error) {
    console.log('⚠️ YouTube iframe access restricted:', error.message);
  } finally {
    document.body.removeChild(testIframe);
  }
}, 1000);

// Check Content Security Policy
console.log('\n🔒 Checking Content Security Policy:');
const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
if (csp) {
  console.log('CSP found:', csp.content);
  if (csp.content.includes('frame-src')) {
    console.log('Frame-src directive present - check if YouTube is allowed');
  }
} else {
  console.log('No CSP meta tag found');
}

// Instructions
console.log('\n📋 Next Steps:');
console.log('1. If TMDB token is missing: Add it to Coolify environment variables');
console.log('2. If API test fails: Check token validity at themoviedb.org');
console.log('3. If YouTube is blocked: Check CSP or network restrictions');
console.log('4. After making changes: Redeploy the application');
console.log('5. If still not working: Check browser console for additional errors');

console.log('\n🆘 Need Help?');
console.log('- TMDB API Key: https://www.themoviedb.org/settings/api');
console.log('- Coolify Docs: https://coolify.io/docs');
console.log('- Open browser dev tools and check Console tab for errors');
