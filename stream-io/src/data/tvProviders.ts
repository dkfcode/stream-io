// TV Provider data with verified icons and authentication endpoints
export interface TVProvider {
  id: string;
  name: string;
  logo: string;
  authUrl: string;
  streamBaseUrl: string;
  isSubscriptionRequired: boolean;
  subscriptionTiers: string[];
  iconFallback: string;
}

export const TV_PROVIDERS: TVProvider[] = [
  {
    id: 'xfinity',
    name: 'Xfinity',
    logo: '/images/logos/xfinity/logo.png',
    authUrl: 'https://customer.xfinity.com/oauth/login',
    streamBaseUrl: 'https://www.xfinity.com/stream',
    isSubscriptionRequired: true,
    subscriptionTiers: ['Limited Basic', 'Expanded Basic', 'Digital Starter', 'Digital Preferred'],
    iconFallback: 'XFN'
  },
  {
    id: 'directv',
    name: 'DIRECTV',
    logo: '/images/logos/directv/logo.png',
    authUrl: 'https://www.directv.com/sign-in',
    streamBaseUrl: 'https://www.directv.com/stream',
    isSubscriptionRequired: true,
    subscriptionTiers: ['Entertainment', 'Choice', 'Ultimate', 'Premier'],
    iconFallback: 'DTV'
  },
  {
    id: 'att-uverse',
    name: 'AT&T U-verse',
    logo: '/images/logos/att-uverse/logo.png',
    authUrl: 'https://www.att.com/my/#/signin',
    streamBaseUrl: 'https://www.att.com/tv/u-verse',
    isSubscriptionRequired: true,
    subscriptionTiers: ['U-basic', 'U200', 'U300', 'U450'],
    iconFallback: 'ATT'
  },
  {
    id: 'youtube-tv',
    name: 'YouTube TV',
    logo: '/images/logos/youtube-tv/logo.png',
    authUrl: 'https://accounts.google.com/signin',
    streamBaseUrl: 'https://tv.youtube.com',
    isSubscriptionRequired: true,
    subscriptionTiers: ['Base Plan', '4K Plus'],
    iconFallback: 'YTV'
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    logo: '/images/logos/spectrum/logo.png',
    authUrl: 'https://www.spectrum.net/login',
    streamBaseUrl: 'https://www.spectrum.net/watch-tv',
    isSubscriptionRequired: true,
    subscriptionTiers: ['TV Select', 'TV Silver', 'TV Gold'],
    iconFallback: 'SPEC'
  },

  {
    id: 'dish',
    name: 'DISH Network',
    logo: '/images/logos/dish/logo.png',
    authUrl: 'https://www.dish.com/sign-in',
    streamBaseUrl: 'https://www.dish.com/anywhere',
    isSubscriptionRequired: true,
    subscriptionTiers: ['Flex Pack', 'America\'s Top 120', 'America\'s Top 200'],
    iconFallback: 'DISH'
  },
  {
    id: 'verizon-fios',
    name: 'Verizon Fios',
    logo: '/images/logos/verizon-fios/logo.png',
    authUrl: 'https://login.verizon.com/amserver/UI/Login',
    streamBaseUrl: 'https://www.verizon.com/home/fios-tv',
    isSubscriptionRequired: true,
    subscriptionTiers: ['Your Fios TV', 'More Fios TV', 'Most Fios TV'],
    iconFallback: 'VZN'
  },
  {
    id: 'cox',
    name: 'Cox Communications',
    logo: '/images/logos/cox/logo.png',
    authUrl: 'https://www.cox.com/residential/sign-in.html',
    streamBaseUrl: 'https://www.cox.com/residential/tv/contour-app.html',
    isSubscriptionRequired: true,
    subscriptionTiers: ['Starter', 'Essential', 'Preferred', 'Ultimate'],
    iconFallback: 'COX'
  },
  {
    id: 'optimum',
    name: 'Optimum',
    logo: '/images/logos/optimum/logo.png',
    authUrl: 'https://www.optimum.com/sign-in',
    streamBaseUrl: 'https://www.optimum.com/tv/altice-one',
    isSubscriptionRequired: true,
    subscriptionTiers: ['Core TV', 'Broadcast TV', 'Select TV'],
    iconFallback: 'OPT'
  },

];

// Fallback icon generator
export const generateFallbackIcon = (text: string, size: number = 32): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Background
  ctx.fillStyle = '#6B46C1'; // Purple background
  ctx.fillRect(0, 0, size, size);
  
  // Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);
  
  return canvas.toDataURL();
};