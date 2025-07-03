// Channel brand colors mapping for logos
export interface ChannelBrand {
  backgroundColor: string;
  textColor?: string;
}

export const CHANNEL_BRAND_COLORS: Record<string, ChannelBrand> = {
  // Broadcast Networks
  'ABC': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'CBS': {
    backgroundColor: '#003DA5', // CBS Blue
    textColor: '#FFFFFF'
  },
  'NBC': {
    backgroundColor: '#6B46C1', // Purple/Peacock colors
    textColor: '#FFFFFF'
  },
  'FOX': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'Fox': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  
  // News Networks
  'CNN': {
    backgroundColor: '#FFFFFF', // CNN White
    textColor: '#000000'
  },
  'FOX News': {
    backgroundColor: '#003366', // Fox News Blue
    textColor: '#FFFFFF'
  },
  'MSNBC': {
    backgroundColor: '#0078D4', // MSNBC Blue
    textColor: '#FFFFFF'
  },
  
  // Sports Networks
  'ESPN': {
    backgroundColor: '#FFFFFF', // ESPN White
    textColor: '#000000'
  },
  'FS1': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'NFL Network': {
    backgroundColor: '#013369', // NFL Blue
    textColor: '#FFFFFF'
  },
  
  // Entertainment Networks
  'Disney': {
    backgroundColor: '#0066CC', // Disney Blue
    textColor: '#FFFFFF'
  },
  'Disney Channel': {
    backgroundColor: '#0066CC', // Disney Blue
    textColor: '#FFFFFF'
  },
  'Nickelodeon': {
    backgroundColor: '#FF6600', // Nickelodeon Orange
    textColor: '#FFFFFF'
  },
  'Cartoon Network': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'TBS': {
    backgroundColor: '#FF0080', // TBS Magenta (2020 rebrand)
    textColor: '#FFFFFF'
  },
  'TNT': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'USA Network': {
    backgroundColor: '#0033A0', // USA Blue
    textColor: '#FFFFFF'
  },
  'FX': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  
  // Lifestyle Networks
  'Food Network': {
    backgroundColor: '#E4002B', // Food Network Red
    textColor: '#FFFFFF'
  },
  'HGTV': {
    backgroundColor: '#71B53B', // HGTV Green
    textColor: '#FFFFFF'
  },
  'Discovery': {
    backgroundColor: '#00D4AA', // Discovery Teal
    textColor: '#FFFFFF'
  },
  'TLC': {
    backgroundColor: '#662D91', // TLC Purple
    textColor: '#FFFFFF'
  },
  'Lifetime': {
    backgroundColor: '#E4002B', // Lifetime Red
    textColor: '#FFFFFF'
  },
  'Hallmark': {
    backgroundColor: '#6B2C91', // Hallmark Purple
    textColor: '#FFFFFF'
  },
  'Bravo': {
    backgroundColor: '#5B2C87', // Bravo Purple
    textColor: '#FFFFFF'
  },
  
  // Premium Networks
  'HBO': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'Showtime': {
    backgroundColor: '#FF0000', // Showtime Red
    textColor: '#FFFFFF'
  },
  'Starz': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  
  // Kids Networks
  'PBS Kids': {
    backgroundColor: '#0066CC', // PBS Blue
    textColor: '#FFFFFF'
  },
  'Disney Jr': {
    backgroundColor: '#4B0082', // Disney Jr Purple
    textColor: '#FFFFFF'
  },
  'Nick Jr': {
    backgroundColor: '#67C3CC', // Nick Jr Light Blue
    textColor: '#FFFFFF'
  },
  
  // Other Networks
  'ION Television': {
    backgroundColor: '#1F4E79', // ION Blue
    textColor: '#FFFFFF'
  },
  'ION': {
    backgroundColor: '#1F4E79', // ION Blue
    textColor: '#FFFFFF'
  },
  'The CW': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'CW': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'A&E': {
    backgroundColor: '#000000', // Black
    textColor: '#FFFFFF'
  },
  'History': {
    backgroundColor: '#8B4513', // History Brown
    textColor: '#FFFFFF'
  },
  'National Geographic': {
    backgroundColor: '#FFCC00', // NatGeo Yellow
    textColor: '#000000'
  },
  'NatGeo': {
    backgroundColor: '#FFCC00', // NatGeo Yellow
    textColor: '#000000'
  }
};

// Utility function to get brand colors for a channel
export const getChannelBrandColors = (channelName: string): ChannelBrand => {
  // Try exact match first
  if (CHANNEL_BRAND_COLORS[channelName]) {
    return CHANNEL_BRAND_COLORS[channelName];
  }
  
  // Try partial matches for common variations
  const normalizedName = channelName.toLowerCase();
  for (const [key, colors] of Object.entries(CHANNEL_BRAND_COLORS)) {
    if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
      return colors;
    }
  }
  
  // Default fallback colors
  return {
    backgroundColor: '#374151', // gray-700
    textColor: '#FFFFFF'
  };
};

// Utility function to convert hex to RGB with opacity
export const hexToRgba = (hex: string, opacity: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(55, 65, 81, ${opacity})`; // Default gray
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}; 