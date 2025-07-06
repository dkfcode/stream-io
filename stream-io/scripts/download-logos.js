#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGOS_DIR = path.join(__dirname, '..', 'public', 'images', 'logos');

// Live Channel Network Logos (from LiveFeaturedTab.tsx)
const liveChannelLogos = {
  'abc': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/ABC_2021_logo_White.png/1200px-ABC_2021_logo_White.png',
    fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/ABC_2021_logo_White.png/1200px-ABC_2021_logo_White.png'
  },
  'cbs': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_logo.svg/512px-CBS_logo.svg.png',
    fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_logo.svg/512px-CBS_logo.svg.png'
  },
  'cnn': {
    logo: 'https://download.logo.wine/logo/CNN/CNN-Logo.wine.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/CNN-Logo.png'
  },
  'disney-channel': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Disney_Channel_2014_Gradient.png/960px-Disney_Channel_2014_Gradient.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/11/Disney-Channel-Logo.png'
  },
  'espn': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/512px-ESPN_wordmark.svg.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/ESPN-Logo.png'
  },
  'food-network': {
    logo: 'https://www.pngfind.com/pngs/m/114-1143949_food-network-food-network-black-and-white-hd.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/07/Food-Network-Logo.png'
  },
  'fox': {
    logo: 'https://wp-cdn.milocloud.com/cap-equity-wp/wp-content/uploads/2020/04/08180526/ox-logo-fox-tv-logo-png.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Fox-Logo.png'
  },
  'fox-news': {
    logo: 'https://cdn.shopify.com/s/files/1/0558/6413/1764/files/Fox_News_Logo_Design_History_Evolution_0_1024x1024.jpg?v=1694099298',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Fox-News-Logo.png'
  },
  'hallmark-channel': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Hallmark_Channel.svg/512px-Hallmark_Channel.svg.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/07/Hallmark-Channel-Logo.png'
  },
  'ion-television': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Ion_logo.svg/250px-Ion_logo.svg.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Ion-Television-Logo.png'
  },
  'lifetime': {
    logo: 'https://aenselect.com/admin/images/Lifetime_Logo_2019_WHITE.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Lifetime-Logo.png'
  },
  'nbc': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/512px-NBC_logo.svg.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/NBC-Logo.png'
  },
  'nickelodeon': {
    logo: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/a5c95036-7303-4d2d-a772-c4d136a13666/dgac7br-88e5738d-89be-4e30-8811-ddb2a05900cf.png/v1/fill/w_1280,h_183/nickelodeon_2009_logo_white_by_gamer8371_dgac7br-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTgzIiwicGF0aCI6IlwvZlwvYTVjOTUwMzYtNzMwMy00ZDJkLWE3NzItYzRkMTM2YTEzNjY2XC9kZ2FjN2JyLTg4ZTU3MzhkLTg5YmUtNGUzMC04ODExLWRkYjJhMDU5MDBjZi5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.MzGkbXjjLkwUVRJPBzyaFEolRwsRlhehviikEnS4bAk',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Nickelodeon-Logo.png'
  },
  'tbs': {
    logo: 'https://cdn.sanity.io/images/1pn9obcz/production/8ea9832e8c824cc4b891f5b42460eb6ec78024b5-960x1080.jpg?auto=format&q=80&w=600',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/TBS-Logo.png'
  },
  'tnt': {
    logo: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/680f90a5-35e4-4f31-b1b6-ee9b3e8fda12/den1xvt-dd983f14-9eb2-402d-954b-078719a24f71.jpg/v1/fill/w_1024,h_598,q_75,strp/tnt_logo_black_background_official_by_teamrocketdjvgboy123_den1xvt-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NTk4IiwicGF0aCI6IlwvZlwvNjgwZjkwYTUtMzVlNC00ZjMxLWIxYjYtZWU5YjNlOGZkYTEyXC9kZW4xeHZ0LWRkOTgzZjE0LTllYjItNDAyZC05NTRiLTA3ODcxOWEyNGY3MS5qcGciLCJ3aWR0aCI6Ijw9MTAyNCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.wx72c2z-EEbSjr8I_bJtAGbJV7yZbKSv3o0XyREqTls',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/TNT-Logo.png'
  }
};

// Streaming service logos (existing)
const logoSources = {
  'apple-tv': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/AppleTVLogo.svg/2048px-AppleTVLogo.svg.png',
    fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/AppleTVLogo.svg/2048px-AppleTVLogo.svg.png'
  },
  'netflix': {
    logo: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Netflix-Logo.png'
  },
  'disney-plus': {
    logo: 'https://m.media-amazon.com/images/I/719t3jd2NeL.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/11/Disney-Plus-Logo.png'
  },
  'prime-video': {
    logo: 'https://m.media-amazon.com/images/I/31W9hs7w0JL.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Amazon-Prime-Logo.png'
  },
  'hulu': {
    logo: 'https://play-lh.googleusercontent.com/4whGAVjZGrrlNxzheKAfBXrxggtyAb4euWLeQI8fDfVfdnFEZjE0DZTJ8DKoh64pqcIa=w240-h480-rw',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/05/Hulu-Logo.png'
  },
  'max': {
    logo: 'https://cdn6.aptoide.com/imgs/4/2/d/42dc60380274e539015fbdbcabb4f44e_icon.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2022/04/HBO-Max-Logo.png'
  },
  'peacock': {
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjnxsp3Q-Q11wjcwRIFz0xY4QXE5YEvibpbQ&s',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/07/Peacock-Logo.png'
  },
  'paramount-plus': {
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/66/e7/22/66e722b3-1817-18a2-c1b9-84c86ffbe85c/P_U002bAppIcon-1x_U007emarketing-0-7-0-85-220-0.png/1024x1024.jpg',
    fallback: 'https://logos-world.net/wp-content/uploads/2021/02/Paramount-Plus-Logo.png'
  },
  'starz': {
    logo: 'https://play-lh.googleusercontent.com/ZF0lnNTgrJqZ-WLubeF09m_gLt4IaL7189Wv0F6uwHmO7gJB3Om5bhanXdJci8FenNuS',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Starz-Logo.png'
  },
  'crunchyroll': {
    logo: 'https://play-lh.googleusercontent.com/Fnor8mzNEsiWTfSTI_RXUmsaZW0eYw0RkIgIhSCphG4Y0ZgwC-zK2qzik-9VIxQDWQ',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/07/Crunchyroll-Logo.png'
  },
  'xfinity': {
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWpRaoODhDOUorsydjq8AjsqHzy5CijJJ0BA&s',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Xfinity-Logo.png'
  },
  'directv': {
    logo: 'https://play-lh.googleusercontent.com/OeeL1D_m19xsMRQdhjYaetJukmAUpqRrUW-DKq8Htg2usZ3Oplam7t1tPDXhbVP-ww',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/DIRECTV-Logo.png'
  },
  'att-uverse': {
    logo: 'https://images.seeklogo.com/logo-png/32/1/att-logo-png_seeklogo-326374.png',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/ATT-Logo.png'
  },
  'youtube-tv': {
    logo: 'https://play-lh.googleusercontent.com/5zpYRYi0mRIQi56FyDibKR3sWi-UfkD2QFKRdhZzK7Hh3e9l_9y5i0z3lQWhmJmUzh4',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/YouTube-TV-Logo.png'
  },
  'spectrum': {
    logo: 'https://play-lh.googleusercontent.com/inkbwM_c8IuBH1PnbFOxhGxh_Lrht4NxvnXvaVlbX7b3ZtWxV-uYkwowtBetI__46xGJ',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Spectrum-Logo.png'
  },
  'dish': {
    logo: 'https://play-lh.googleusercontent.com/xNianMk0N7drCYg4scEK8mjvEjdTfRWB-VpVao1gZArvYAJWNP8F6eNOoulNwej4m655',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/DISH-Logo.png'
  },
  'verizon-fios': {
    logo: 'https://play-lh.googleusercontent.com/GiLCkzUxJ0OuXsF7IW-Qq1FihrtARzXb9Fs7bzZiBOnR0yCe53Ut69Axltaqqa3jpg',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Verizon-Fios-Logo.png'
  },
  'cox': {
    logo: 'https://play-lh.googleusercontent.com/D72e338_fKu_8ZQB8K0G4LOmwFmsG0JaMR_uV7qUKWEkjMiOESr72tDYmOLjl4gpVE0',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Cox-Logo.png'
  },
  'optimum': {
    logo: 'https://play-lh.googleusercontent.com/kIn3bDqRmMjbKppWAHEbeTjRX0exC2WcizsmeK9AUL8eloCdaRK_usGd8lNIWptGSkpF',
    fallback: 'https://logos-world.net/wp-content/uploads/2020/04/Optimum-Logo.png'
  }
};

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filepath);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${path.basename(filepath)}`);
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', reject);
  });
}

async function downloadLogos() {
  console.log('📥 Downloading all logos (live channels, streaming services, and TV providers)...\n');

  const liveChannels = Object.keys(liveChannelLogos);
  const streamingServices = ['apple-tv', 'netflix', 'disney-plus', 'prime-video', 'hulu', 'max', 'peacock', 'paramount-plus', 'starz', 'crunchyroll'];
  const tvProviders = ['xfinity', 'directv', 'att-uverse', 'youtube-tv', 'spectrum', 'dish', 'verizon-fios', 'cox', 'optimum'];

  // Download live channel logos first
  console.log('📺 Downloading Live Channel Network Logos:');
  console.log('==========================================');
  for (const channelName of liveChannels) {
    if (liveChannelLogos[channelName]) {
      await downloadServiceLogos(channelName, liveChannelLogos[channelName]);
    }
  }

  // Download streaming service logos
  console.log('\n🎬 Downloading Streaming Service Logos:');
  console.log('======================================');
  for (const serviceName of streamingServices) {
    if (logoSources[serviceName]) {
      await downloadServiceLogos(serviceName, logoSources[serviceName]);
    }
  }

  console.log('\n📺 Downloading TV Provider Logos:');
  console.log('==================================');
  for (const providerName of tvProviders) {
    if (logoSources[providerName]) {
      await downloadServiceLogos(providerName, logoSources[providerName]);
    }
  }

  console.log('\n✅ Logo download process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Review downloaded images in public/images/logos/');
  console.log('2. Update LiveFeaturedTab.tsx to use local logo paths');
  console.log('3. Update streamingServices.ts to use local logo paths');
  console.log('4. Update tvProviders.ts to use local logo paths');
}

async function downloadServiceLogos(serviceName, urls) {
  const serviceDir = path.join(LOGOS_DIR, serviceName);
  
  // Ensure directory exists
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }

  console.log(`Downloading logos for ${serviceName}...`);

  try {
    // Download primary logo
    const logoExt = path.extname(new URL(urls.logo).pathname) || '.png';
    const logoPath = path.join(serviceDir, `logo${logoExt}`);
    await downloadFile(urls.logo, logoPath);

    // Download fallback logo
    if (urls.fallback) {
      const fallbackExt = path.extname(new URL(urls.fallback).pathname) || '.png';
      const fallbackPath = path.join(serviceDir, `fallback${fallbackExt}`);
      await downloadFile(urls.fallback, fallbackPath);
    }

    // Add a small delay to be respectful to servers
    await new Promise(resolve => setTimeout(resolve, 500));

  } catch (error) {
    console.error(`❌ Error downloading ${serviceName}: ${error.message}`);
  }

  console.log('');
}

// Run the download process
downloadLogos().catch(console.error); 