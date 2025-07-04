console.log('TMDB Token Check:', import.meta.env.VITE_TMDB_ACCESS_TOKEN?.substring(0, 20) + '...');

// Simple test script to debug actor search functionality

// Test the TMDB searchPeople function directly
const testActorSearch = async () => {
  try {
    console.log('🔍 Testing actor search functionality...');
    
    // Import the searchPeople function
    const { searchPeople } = await import('./src/services/tmdb.ts');
    
    // Test search for "tom"
    console.log('\n👤 Testing search for "tom"...');
    const tomResults = await searchPeople('tom');
    console.log('Tom results:', tomResults.length, 'found');
    tomResults.forEach((person, index) => {
      console.log(`${index + 1}. ${person.name} (ID: ${person.id}, Popularity: ${person.popularity})`);
      console.log(`   Department: ${person.known_for_department}`);
      console.log(`   Known for: ${person.known_for.map(k => k.title || k.name).join(', ')}`);
    });
    
    // Test search for "tom cruise"
    console.log('\n👤 Testing search for "tom cruise"...');
    const tomCruiseResults = await searchPeople('tom cruise');
    console.log('Tom Cruise results:', tomCruiseResults.length, 'found');
    tomCruiseResults.forEach((person, index) => {
      console.log(`${index + 1}. ${person.name} (ID: ${person.id}, Popularity: ${person.popularity})`);
      console.log(`   Department: ${person.known_for_department}`);
      console.log(`   Known for: ${person.known_for.map(k => k.title || k.name).join(', ')}`);
    });
    
    // Test the ML search service
    console.log('\n🧠 Testing ML search service...');
    const { mlSearchService } = await import('./src/services/mlSearchService.ts');
    
    const mlResults = await mlSearchService.performMLSearch('tom', {
      includePersonContent: true,
      maxResults: 10
    });
    
    console.log('ML search results:', mlResults.results.length, 'found');
    console.log('Search strategy:', mlResults.searchStrategy);
    console.log('Confidence:', mlResults.confidence);
    
    const actorResults = mlResults.results.filter(r => r.media_type === 'person');
    console.log('Actor results from ML search:', actorResults.length, 'found');
    actorResults.forEach((actor, index) => {
      console.log(`${index + 1}. ${actor.name} (ID: ${actor.id})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for browser console testing
window.testActorSearch = testActorSearch;

console.log('🔧 Debug script loaded. Run testActorSearch() in the browser console to test actor search.');
