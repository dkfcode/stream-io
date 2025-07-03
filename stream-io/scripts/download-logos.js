#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGOS_DIR = path.join(__dirname, '..', 'src', 'assets', 'images', 'logos');

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
  console.log('📥 Downloading streaming service and TV provider logos...\n');

  const streamingServices = ['apple-tv', 'netflix', 'disney-plus', 'prime-video', 'hulu', 'max', 'peacock', 'paramount-plus', 'starz', 'crunchyroll'];
  const tvProviders = ['xfinity', 'directv', 'att-uverse', 'youtube-tv', 'spectrum', 'dish', 'verizon-fios', 'cox', 'optimum'];

  // Download streaming service logos
  console.log('🎬 Downloading Streaming Service Logos:');
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
  console.log('2. Update streamingServices.ts to use local logo paths');
  console.log('3. Update tvProviders.ts to use local logo paths');
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