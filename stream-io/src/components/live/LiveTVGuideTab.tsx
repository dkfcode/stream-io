import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Filter, MapPin, Clock, Calendar, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { usePreferences } from '../../stores/preferencesStore';
import { useI18n } from '../../constants/i18n';
import { TV_PROVIDERS } from '../../data/tvProviders';
import { locationService, LocationData } from '../../services/locationService';
import type { SearchResult } from '../../types/tmdb';
import { getChannelBrandColors, hexToRgba } from '../../constants/channelBrandColors';

// Mock types to replace Gracenote types
interface MockChannel {
  channel: string;
  callSign: string;
  stationId: string;
  preferredImage?: {
    uri: string;
    width: string;
    height: string;
    category: string;
  };
}

interface MockProgram {
  startTime: string;
  endTime: string;
  duration: number;
  qualifiers?: string[];
  ratings?: Array<{
    body: string;
    code: string;
  }>;
  program: {
    tmsId: string;
    title: string;
    shortDescription?: string;
    longDescription?: string;
    genres?: string[];
    origAirDate?: string;
    episodeTitle?: string;
    preferredImage?: {
      uri: string;
      width: string;
      height: string;
      category: string;
    };
  };
}

interface MockChannelSchedule {
  stationId: string;
  callSign: string;
  channel: string;
  preferredImage?: {
    uri: string;
    width: string;
    height: string;
    category: string;
  };
  airings: MockProgram[];
}

interface LiveTVGuideTabProps {
  onItemClick: (item: SearchResult) => void;
  selectedFilter?: string;
}

const LiveTVGuideTab: React.FC<LiveTVGuideTabProps> = ({ onItemClick, selectedFilter = 'all-providers' }) => {
  const { preferences } = usePreferences();
  const selectedProviders = preferences.selected_providers || [];
  const { t } = useI18n();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0);
  const [tvGuideData, setTvGuideData] = useState<MockChannelSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channelsToShow, setChannelsToShow] = useState(50);
  
  // Refs for scrolling
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const channelScrollRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Generate time slots for the next 24 hours from previous 30-minute increment
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    
    // Round down to previous 30-minute increment
    const baseTime = new Date(now);
    const minutes = now.getMinutes();
    if (minutes < 30) {
      baseTime.setMinutes(0, 0, 0);
    } else {
      baseTime.setMinutes(30, 0, 0);
    }
    
    // Generate 48 slots (24 hours * 2 slots per hour)
    for (let i = 0; i < 48; i++) {
      const time = new Date(baseTime.getTime() + (i * 30 * 60 * 1000));
      slots.push(time);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Sync all horizontal scroll containers
  const syncHorizontalScroll = (scrollLeft: number, excludeIndex?: number) => {
    // Sync time header
    if (timeScrollRef.current) {
      timeScrollRef.current.scrollLeft = scrollLeft;
    }
    
    // Sync all channel rows
    channelScrollRefs.current.forEach((ref, index) => {
      if (ref && index !== excludeIndex) {
        ref.scrollLeft = scrollLeft;
      }
    });
  };

  // Calculate program width based on duration (in 30-minute increments)
  const calculateProgramWidth = (startTime: string, endTime: string): number => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const slots = Math.ceil(durationMinutes / 30); // Each slot is 30 minutes
    return Math.max(1, slots); // Minimum 1 slot
  };

  // Enhanced function to find which time slot index a program starts at
  const getStartingSlotIndex = (programStartTime: string): number => {
    const programStart = new Date(programStartTime);
    
    // First try exact match
    let bestIndex = timeSlots.findIndex(slot => {
      const slotEnd = new Date(slot.getTime() + 30 * 60 * 1000);
      return programStart >= slot && programStart < slotEnd;
    });
    
    // If no exact match, find the closest slot
    if (bestIndex === -1) {
      let minDiff = Infinity;
      timeSlots.forEach((slot, index) => {
        const diff = Math.abs(programStart.getTime() - slot.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          bestIndex = index;
        }
      });
    }
    
    // Ensure we don't go beyond our time window
    return Math.max(0, Math.min(bestIndex, timeSlots.length - 1));
  };

  // Comprehensive channel list with 50+ popular channels
  const getAllChannels = (): MockChannelSchedule[] => {
    return [
      // Broadcast Networks
      { stationId: '1', callSign: 'CBS', channel: '2.1', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_logo.svg/1920px-CBS_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '2', callSign: 'NBC', channel: '4.1', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/1200px-NBC_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '3', callSign: 'ABC', channel: '7.1', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/ABC_2021_logo_White.png/1200px-ABC_2021_logo_White.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '4', callSign: 'FOX', channel: '5.1', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Fox_Broadcasting_Company_logo.svg/256px-Fox_Broadcasting_Company_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '5', callSign: 'PBS', channel: '8.1', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/PBS_logo.svg/512px-PBS_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '6', callSign: 'CW', channel: '11.1', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_CW.svg/512px-The_CW.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // News Networks
      { stationId: '7', callSign: 'CNN', channel: '202', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/320px-CNN.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '8', callSign: 'FOX News', channel: '205', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/512px-Fox_News_Channel_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '9', callSign: 'MSNBC', channel: '209', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/MSNBC_logo.svg/512px-MSNBC_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '10', callSign: 'CNBC', channel: '208', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/512px-CNBC_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Sports Networks
      { stationId: '11', callSign: 'ESPN', channel: '206', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ESPN_wordmark.svg/320px-ESPN_wordmark.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '12', callSign: 'ESPN2', channel: '207', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/ESPN2_logo.svg/512px-ESPN2_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '13', callSign: 'FS1', channel: '210', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Fox_Sports_1_logo.svg/512px-Fox_Sports_1_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '14', callSign: 'NFL Network', channel: '212', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/95/NFL_Network_logo.svg/512px-NFL_Network_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '15', callSign: 'NBA TV', channel: '213', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/NBA_TV.svg/512px-NBA_TV.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Entertainment Networks
      { stationId: '16', callSign: 'AMC', channel: '254', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/AMC_logo_2016.svg/512px-AMC_logo_2016.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '17', callSign: 'FX', channel: '248', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/FX_International_logo.svg/512px-FX_International_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '18', callSign: 'USA', channel: '242', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/USA_Network_logo_%282016%29.svg/512px-USA_Network_logo_%282016%29.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '19', callSign: 'TNT', channel: '245', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/TNT_Logo_2016.svg/512px-TNT_Logo_2016.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '20', callSign: 'TBS', channel: '247', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/TBS_logo_2016.svg/512px-TBS_logo_2016.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Documentary & Educational
      { stationId: '21', callSign: 'History', channel: '120', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Logo.svg/320px-History_Logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '22', callSign: 'Discovery', channel: '140', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Discovery_Channel_logo.svg/320px-Discovery_Channel_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '23', callSign: 'National Geographic', channel: '186', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/National_Geographic_Channel.svg/320px-National_Geographic_Channel.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '24', callSign: 'Animal Planet', channel: '141', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/2018_Animal_Planet_logo.svg/512px-2018_Animal_Planet_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '25', callSign: 'Science Channel', channel: '143', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Science_Channel_logo.svg/512px-Science_Channel_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Comedy Networks  
      { stationId: '26', callSign: 'Comedy Central', channel: '107', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Comedy_Central_2018.svg/320px-Comedy_Central_2018.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '27', callSign: 'Adult Swim', channel: '108', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Adult_Swim_2003_logo.svg/512px-Adult_Swim_2003_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Kids & Family
      { stationId: '28', callSign: 'Disney Channel', channel: '290', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/2019_Disney_Channel_logo.svg/512px-2019_Disney_Channel_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '29', callSign: 'Nickelodeon', channel: '295', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Nickelodeon_2009_logo.svg/512px-Nickelodeon_2009_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '30', callSign: 'Cartoon Network', channel: '296', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/512px-Cartoon_Network_2010_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Lifestyle Networks
      { stationId: '31', callSign: 'HGTV', channel: '229', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/HGTV_US_Logo_2015.svg/512px-HGTV_US_Logo_2015.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '32', callSign: 'Food Network', channel: '231', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Food_Network_logo.svg/512px-Food_Network_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '33', callSign: 'Travel Channel', channel: '235', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Travel_Channel_logo_2018.svg/512px-Travel_Channel_logo_2018.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '34', callSign: 'TLC', channel: '183', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/TLC_Logo.svg/512px-TLC_Logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '35', callSign: 'Bravo', channel: '237', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Bravo_logo.svg/512px-Bravo_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Music Networks
      { stationId: '36', callSign: 'MTV', channel: '160', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/MTV-2021.svg/512px-MTV-2021.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '37', callSign: 'VH1', channel: '162', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/VH1_logonew.svg/512px-VH1_logonew.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '38', callSign: 'CMT', channel: '166', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/CMT_2017_logo.svg/512px-CMT_2017_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Premium Networks (Mock as basic cable)
      { stationId: '39', callSign: 'HBO', channel: '300', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/512px-HBO_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '40', callSign: 'Showtime', channel: '318', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Showtime.svg/512px-Showtime.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '41', callSign: 'Starz', channel: '340', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Starz_2016.svg/512px-Starz_2016.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Additional Networks
      { stationId: '42', callSign: 'Syfy', channel: '244', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Syfy.svg/512px-Syfy.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '43', callSign: 'A&E', channel: '118', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/A%26E_Network_logo.svg/512px-A%26E_Network_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '44', callSign: 'Lifetime', channel: '252', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Lifetime_2020.svg/512px-Logo_Lifetime_2020.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '45', callSign: 'E!', channel: '236', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/E%21_Logo.svg/512px-E%21_Logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '46', callSign: 'Oxygen', channel: '251', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Oxygen_TV_Logo.svg/512px-Oxygen_TV_Logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '47', callSign: 'ID', channel: '285', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Investigation_Discovery_Logo_2018.svg/512px-Investigation_Discovery_Logo_2018.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '48', callSign: 'Weather Channel', channel: '362', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/The_Weather_Channel_logo_2005-2013.svg/512px-The_Weather_Channel_logo_2005-2013.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '49', callSign: 'BET', channel: '329', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/BET_logo_%282017%29.svg/512px-BET_logo_%282017%29.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '50', callSign: 'OWN', channel: '279', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Own_logo_2011.svg/512px-Own_logo_2011.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      
      // Additional 50 more channels for pagination demonstration
      { stationId: '51', callSign: 'Hallmark', channel: '312', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Hallmark_Channel.svg/512px-Hallmark_Channel.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '52', callSign: 'ION', channel: '049', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Ion_logo.svg/250px-Ion_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '53', callSign: 'Paramount Network', channel: '241', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Paramount_Network_logo.svg/512px-Paramount_Network_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '54', callSign: 'truTV', channel: '246', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/TruTV_2014_logo.svg/512px-TruTV_2014_logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      { stationId: '55', callSign: 'IFC', channel: '249', preferredImage: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/IFC_Logo.svg/512px-IFC_Logo.svg.png', width: '100', height: '100', category: 'logo' }, airings: [] },
      // ... Continue up to 100+ channels for robust pagination
    ];
  };

  // Enhanced program title generation with comprehensive programming for all networks
  const generateMockProgramTitle = (network: string, time: Date): string => {
    const hour = time.getHours();
    const day = time.getDay(); // 0 = Sunday, 6 = Saturday
    const timeOfDay = hour < 6 ? 'Late Night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : hour < 22 ? 'Evening' : 'Late Night';
    
    const programTypes: { [key: string]: string[] } = {
      // Broadcast Networks
      'CBS': [`${timeOfDay} News`, 'NCIS', 'Young Sheldon', 'The Price is Right', 'CBS Evening News', 'Late Show with Stephen Colbert', 'Blue Bloods', 'FBI', 'The Neighborhood'],
      'NBC': ['Today Show', 'The Voice', 'This Is Us', 'Saturday Night Live', 'NBC Nightly News', 'The Tonight Show', 'Chicago Fire', 'Law & Order SVU', 'Days of Our Lives'],
      'ABC': ['Good Morning America', 'The Bachelor', 'Grey\'s Anatomy', 'Wheel of Fortune', 'ABC World News', 'Jimmy Kimmel Live', 'Dancing with the Stars', '20/20', 'General Hospital'],
      'FOX': [`${timeOfDay} News`, 'The Simpsons', 'Family Guy', 'The Masked Singer', 'Hell\'s Kitchen', 'MasterChef', '9-1-1', 'Empire', 'Bob\'s Burgers'],
      'PBS': ['PBS NewsHour', 'Masterpiece', 'Nature', 'Nova', 'Antiques Roadshow', 'Great Performances', 'Finding Your Roots', 'Frontline', 'American Experience'],
      'CW': ['Riverdale', 'The Flash', 'Supernatural', 'All American', 'Charmed', 'Batwoman', 'Legacies', 'In the Dark', 'Nancy Drew'],
      
      // News Networks
      'CNN': [`${timeOfDay} Newsroom`, 'Anderson Cooper 360', 'The Situation Room', 'New Day', 'CNN Tonight', 'Fareed Zakaria GPS', 'State of the Union', 'Reliable Sources'],
      'FOX News': ['Fox & Friends', 'The Five', 'Tucker Carlson Tonight', 'Hannity', 'The Ingraham Angle', 'Special Report', 'America\'s Newsroom', 'Outnumbered'],
      'MSNBC': ['Morning Joe', 'The Rachel Maddow Show', 'All In with Chris Hayes', 'The Last Word', 'Deadline: White House', 'The Beat', 'Hardball', 'Meet the Press Daily'],
      'CNBC': ['Squawk Box', 'Power Lunch', 'Closing Bell', 'Mad Money', 'Fast Money', 'The Profit', 'Shark Tank', 'American Greed'],
      
      // Sports Networks
      'ESPN': ['SportsCenter', 'NFL Live', 'NBA Countdown', 'College GameDay', 'Baseball Tonight', 'Outside the Lines', 'E:60', 'First Take', 'Get Up'],
      'ESPN2': ['SportsCenter', 'NFL Insiders', 'NBA Tonight', 'College Football', 'MLB Tonight', 'Tennis Coverage', 'Soccer', 'Highly Questionable'],
      'FS1': ['Skip and Shannon', 'The Herd', 'Speak for Yourself', 'First Things First', 'College Football', 'MLB Coverage', 'UFC Tonight', 'NASCAR Race Hub'],
      'NFL Network': ['Good Morning Football', 'NFL Live', 'Total Access', 'Around the NFL', 'Thursday Night Football', 'NFL RedZone', 'Hard Knocks', 'A Football Life'],
      'NBA TV': ['NBA GameTime', 'Open Court', 'The Jump', 'NBA TV Originals', 'Classic Games', 'Draft Coverage', 'Summer League', 'G League'],
      
      // Entertainment Networks
      'AMC': ['The Walking Dead', 'Breaking Bad', 'Better Call Saul', 'Mad Men', 'Fear the Walking Dead', 'Into the Badlands', 'Preacher', 'The Terror'],
      'FX': ['American Horror Story', 'Fargo', 'Atlanta', 'The Americans', 'Archer', 'Legion', 'Snowfall', 'Pose'],
      'USA': ['Mr. Robot', 'Suits', 'Queen of the South', 'The Sinner', 'Dirty John', 'Temptation Island', 'Chrisley Knows Best', 'WWE Raw'],
      'TNT': ['The Closer', 'Major Crimes', 'Animal Kingdom', 'Claws', 'Good Behavior', 'NBA on TNT', 'Inside the NBA', 'Snowpiercer'],
      'TBS': ['The Big Bang Theory', 'Friends', 'Conan', 'Full Frontal', 'American Dad', 'Family Guy', 'Seinfeld', 'Brooklyn Nine-Nine'],
      
      // Documentary & Educational
      'History': ['Ancient Aliens', 'Pawn Stars', 'American Pickers', 'The Curse of Oak Island', 'Mountain Men', 'Swamp People', 'Vikings', 'Forged in Fire'],
      'Discovery': ['Deadliest Catch', 'Gold Rush', 'Alaskan Bush People', 'Fast N\' Loud', 'MythBusters', 'How It\'s Made', 'Shark Week', 'Street Outlaws'],
      'National Geographic': ['Life Below Zero', 'Brain Games', 'Cosmos', 'Explorer', 'Locked Up Abroad', 'Taboo', 'Alaska State Troopers', 'Wicked Tuna'],
      'Animal Planet': ['The Zoo', 'My Cat from Hell', 'Pit Bulls & Parolees', 'Dr. Jeff', 'Animal Cops', 'River Monsters', 'Finding Bigfoot', 'Tanked'],
      'Science Channel': ['How It\'s Made', 'MythBusters', 'What on Earth?', 'NASA\'s Unexplained Files', 'Outrageous Acts of Science', 'How the Universe Works', 'Through the Wormhole'],
      
      // Comedy Networks
      'Comedy Central': ['South Park', 'The Daily Show', 'Key & Peele', 'Workaholics', 'Tosh.0', 'Chappelle\'s Show', 'Comedy Central Stand-Up', 'The Office'],
      'Adult Swim': ['Rick and Morty', 'Family Guy', 'American Dad', 'Robot Chicken', 'The Venture Bros', 'Aqua Teen Hunger Force', 'Metalocalypse', 'Tim and Eric'],
      
      // Kids & Family
      'Disney Channel': ['Mickey Mouse Clubhouse', 'Phineas and Ferb', 'Gravity Falls', 'DuckTales', 'The Owl House', 'Amphibia', 'Big City Greens', 'Disney Junior'],
      'Nickelodeon': ['SpongeBob SquarePants', 'The Loud House', 'PAW Patrol', 'Dora the Explorer', 'Blue\'s Clues', 'Henry Danger', 'The Thundermans', 'Game Shakers'],
      'Cartoon Network': ['Adventure Time', 'Steven Universe', 'Teen Titans Go!', 'The Amazing World of Gumball', 'We Bare Bears', 'Regular Show', 'Ben 10', 'OK K.O.!'],
      
      // Lifestyle Networks
      'HGTV': ['Property Brothers', 'House Hunters', 'Fixer Upper', 'Love It or List It', 'Flip or Flop', 'Good Bones', 'Home Town', 'Windy City Rehab'],
      'Food Network': ['Chopped', 'Beat Bobby Flay', 'Diners, Drive-Ins and Dives', 'Guy\'s Grocery Games', 'The Pioneer Woman', 'Barefoot Contessa', 'Iron Chef America'],
      'Travel Channel': ['Ghost Adventures', 'Destination Fear', 'Expedition Unknown', 'Man v. Food', 'Hotel Impossible', 'Mysteries at the Museum', 'Dead Files'],
      'TLC': ['90 Day Fiancé', 'My 600-lb Life', 'Sister Wives', 'Unexpected', 'Dr. Pimple Popper', 'Say Yes to the Dress', 'Little People, Big World'],
      'Bravo': ['The Real Housewives', 'Top Chef', 'Below Deck', 'Project Runway', 'Million Dollar Listing', 'Vanderpump Rules', 'Southern Charm'],
      
      // Music Networks
      'MTV': ['Teen Mom', 'Catfish', 'The Challenge', 'Ridiculousness', 'Jersey Shore', 'Are You the One?', 'Ex on the Beach', 'Siesta Key'],
      'VH1': ['Love & Hip Hop', 'Basketball Wives', 'RuPaul\'s Drag Race', 'Black Ink Crew', 'Family Reunion', 'Cartel Crew', 'My True Crime Story'],
      'CMT': ['Nashville', 'Party Down South', 'Dog and Beth', 'Dallas Cowboys Cheerleaders', 'I Love Kellie Pickler', 'Crossroads', 'CMT Cribs'],
      
      // Premium Networks
      'HBO': ['Game of Thrones', 'Westworld', 'True Detective', 'The Sopranos', 'Succession', 'Big Little Lies', 'Barry', 'Euphoria'],
      'Showtime': ['Homeland', 'Billions', 'Shameless', 'The Affair', 'Ray Donovan', 'Dexter', 'Twin Peaks', 'The Chi'],
      'Starz': ['Power', 'Outlander', 'American Gods', 'The White Queen', 'Black Sails', 'Spartacus', 'Da Vinci\'s Demons', 'Counterpart'],
      
      // Additional Networks
      'Syfy': ['The Expanse', 'Wynonna Earp', 'Killjoys', 'The Magicians', 'Z Nation', 'Van Helsing', 'Warehouse 13', 'Eureka'],
      'A&E': ['Live PD', 'The First 48', 'Storage Wars', 'Duck Dynasty', 'Intervention', 'Hoarders', 'Bates Motel', 'Longmire'],
      'Lifetime': ['Dance Moms', 'Married at First Sight', 'The Rap Game', 'Bring It!', 'Little Women', 'UnREAL', 'Devious Maids'],
      'E!': ['Keeping Up with the Kardashians', 'Total Divas', 'The Royals', 'Very Cavallari', 'Hollywood Medium', 'Daily Pop', 'E! True Hollywood Story'],
      'Oxygen': ['Snapped', 'Cold Justice', 'The Disappearance of', 'Killer Couples', 'Criminal Confessions', 'Accident, Suicide or Murder'],
      'ID': ['Homicide Hunter', 'On the Case', 'Deadly Women', 'Disappeared', 'The First 48', 'Evil Lives Here', 'See No Evil'],
      'Weather Channel': ['Weather Center Live', 'AMHQ', 'Weather Underground', 'Storm Stories', 'Heavy Rescue', 'Highway Thru Hell'],
      'BET': ['The Game', 'Being Mary Jane', 'Real Husbands of Hollywood', 'The Quad', 'Tales', 'American Soul', 'Boomerang'],
      'OWN': ['Queen Sugar', 'Greenleaf', 'The Haves and the Have Nots', 'If Loving You Is Wrong', 'Iyanla: Fix My Life', 'Super Soul Sunday'],
      'Hallmark': ['When Calls the Heart', 'Good Witch', 'Chesapeake Shores', 'Christmas Movies', 'Aurora Teagarden Mysteries', 'Wedding March'],
      'ION': ['Blue Bloods', 'Criminal Minds', 'NCIS', 'Chicago P.D.', 'Law & Order', 'NUMB3RS', 'Without a Trace', 'Cold Case'],
      'Paramount Network': ['Yellowstone', 'Ink Master', 'Bar Rescue', 'Wife Swap', 'The First 48', 'Cops', 'Lip Sync Battle'],
      'truTV': ['Impractical Jokers', 'The Carbonaro Effect', 'Adam Ruins Everything', 'Billy on the Street', 'Talk Show the Game Show'],
      'IFC': ['Portlandia', 'Comedy Bang! Bang!', 'Documentary Now!', 'The Birthday Boys', 'Maron', 'Brockmire', 'Stan Against Evil']
    };

    const programs = programTypes[network];
    if (programs && programs.length > 0) {
      return programs[Math.floor(Math.random() * programs.length)];
    }
    
    // Enhanced fallback with more variety - ensure it never returns empty
    const fallbackPrograms = [
      `${timeOfDay} Programming`,
      `${network} Original Series`,
      `${network} Movie Presentation`,
      `${network} Special Event`,
      `${timeOfDay} ${network}`,
      `Best of ${network}`,
      `${network} Primetime`,
      `Live on ${network}`,
      `${network} Show`,
      `${network} Content`,
      'Programming'
    ];
    
    const selectedTitle = fallbackPrograms[Math.floor(Math.random() * fallbackPrograms.length)];
    return selectedTitle || 'Programming'; // Final safety net
  };

  const getGenresForNetwork = (network: string): string[] => {
    const genreMap: { [key: string]: string[] } = {
      'CBS': ['Drama', 'News', 'Comedy'],
      'NBC': ['Drama', 'News', 'Comedy', 'Reality'],
      'ABC': ['Drama', 'News', 'Reality'],
      'FOX': ['Comedy', 'News', 'Reality', 'Sports'],
      'PBS': ['Documentary', 'Educational', 'News'],
      'CW': ['Drama', 'Sci-Fi', 'Action'],
      'CNN': ['News', 'Documentary'],
      'FOX News': ['News', 'Political'],
      'MSNBC': ['News', 'Political'],
      'CNBC': ['News', 'Business'],
      'ESPN': ['Sports'],
      'ESPN2': ['Sports'],
      'FS1': ['Sports'],
      'NFL Network': ['Sports', 'Football'],
      'NBA TV': ['Sports', 'Basketball'],
      'AMC': ['Drama', 'Horror', 'Action'],
      'FX': ['Drama', 'Comedy', 'Horror'],
      'USA': ['Drama', 'Action', 'Comedy'],
      'TNT': ['Drama', 'Action', 'Sports'],
      'TBS': ['Comedy', 'Drama'],
      'History': ['Documentary', 'Educational'],
      'Discovery': ['Documentary', 'Reality'],
      'National Geographic': ['Documentary', 'Nature'],
      'Animal Planet': ['Documentary', 'Nature'],
      'Science Channel': ['Documentary', 'Educational'],
      'Comedy Central': ['Comedy'],
      'Adult Swim': ['Animation', 'Comedy'],
      'Disney Channel': ['Kids', 'Family', 'Animation'],
      'Nickelodeon': ['Kids', 'Animation'],
      'Cartoon Network': ['Animation', 'Kids'],
      'HGTV': ['Lifestyle', 'Reality'],
      'Food Network': ['Lifestyle', 'Cooking'],
      'Travel Channel': ['Travel', 'Documentary'],
      'TLC': ['Reality', 'Lifestyle'],
      'Bravo': ['Reality', 'Lifestyle'],
      'MTV': ['Reality', 'Music'],
      'VH1': ['Reality', 'Music'],
      'CMT': ['Music', 'Reality'],
      'HBO': ['Drama', 'Comedy', 'Documentary'],
      'Showtime': ['Drama', 'Comedy'],
      'Starz': ['Drama', 'Action'],
      'Syfy': ['Sci-Fi', 'Horror'],
      'A&E': ['Reality', 'Documentary'],
      'Lifetime': ['Drama', 'Reality'],
      'E!': ['Reality', 'Entertainment'],
      'Oxygen': ['Crime', 'Documentary'],
      'ID': ['Crime', 'Documentary'],
      'Weather Channel': ['Weather', 'Documentary'],
      'BET': ['Music', 'Comedy', 'Drama'],
      'OWN': ['Drama', 'Reality', 'Talk'],
      'Hallmark': ['Drama', 'Romance', 'Family'],
      'ION': ['Drama', 'Crime'],
      'Paramount Network': ['Drama', 'Reality'],
      'truTV': ['Comedy', 'Reality'],
      'IFC': ['Comedy', 'Independent']
    };

    return genreMap[network] || ['Entertainment'];
  };

  // Generate mock TV guide with programming for all channels
  const generateMockTVGuide = (): MockChannelSchedule[] => {
    const allChannels = getAllChannels();
    
    // Generate mock programs with aligned time slots for each channel
    allChannels.forEach(channel => {
      const programs: MockProgram[] = [];
      
      // Generate programs for all 48 time slots to ensure continuous coverage
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        const startTime = new Date(timeSlots[slotIndex]);
        
        // Random duration between 1-4 slots (30min-2hrs) but ensure it doesn't exceed remaining slots
        const maxDuration = Math.min(4, timeSlots.length - slotIndex);
        const duration = Math.floor(Math.random() * maxDuration) + 1;
        
        const endTime = new Date(startTime.getTime() + (duration * 30 * 60 * 1000));

        // Generate title with multiple fallback layers to ensure no empty titles
        let programTitle = generateMockProgramTitle(channel.callSign, startTime);
        if (!programTitle || programTitle.trim() === '' || programTitle === null || programTitle === undefined) {
          console.warn(`Empty title generated for ${channel.callSign} at ${startTime}, using fallback`);
          programTitle = `${channel.callSign} Programming`;
        }
        
        // Final safety check
        if (!programTitle || programTitle.trim() === '') {
          programTitle = 'Programming';
        }

        programs.push({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: duration * 30, // Convert to minutes
          qualifiers: Math.random() > 0.8 ? ['New'] : undefined,
          ratings: [{
            body: 'TV',
            code: Math.random() > 0.5 ? 'TV-PG' : Math.random() > 0.5 ? 'TV-14' : 'TV-MA'
          }],
          program: {
            tmsId: `${channel.stationId}_${slotIndex}`,
            title: programTitle,
            shortDescription: `Mock program description for ${channel.callSign}`,
            longDescription: `Extended mock program description for ${channel.callSign} at ${startTime.toLocaleTimeString()}`,
            genres: getGenresForNetwork(channel.callSign),
            origAirDate: startTime.toISOString().split('T')[0],
            episodeTitle: Math.random() > 0.6 ? `Episode ${slotIndex + 1}` : undefined,
            preferredImage: {
              uri: 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(channel.callSign),
              width: '300',
              height: '200',
              category: 'still'
            }
          }
        });

        // Skip ahead by the duration so programs don't overlap
        slotIndex += (duration - 1);
      }

      channel.airings = programs;
    });

    return allChannels;
  };

  // Load TV guide data with mock data
  const loadTVGuideData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get user's location first
      const location = await locationService.getUserLocation();
      setUserLocation(location);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock TV guide data
      const mockSchedule = generateMockTVGuide();
      
      // Sort channels by channel number
      const sortedSchedule = [...mockSchedule].sort((a, b) => {
        const aNum = parseFloat(a.channel) || 0;
        const bNum = parseFloat(b.channel) || 0;
        return aNum - bNum;
      });

      setTvGuideData(sortedSchedule);
    } catch (error) {
      console.error('Error loading TV guide data:', error);
      setError('Failed to load TV guide data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTVGuideData();

    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [selectedProviders, selectedFilter]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleProgramClick = (program: MockProgram) => {
    // Convert mock program to SearchResult format for modal
    const searchResult: SearchResult = {
      id: parseInt(program.program.tmsId.replace(/\D/g, '')) || Math.random(),
      title: program.program.title,
      name: program.program.title,
      overview: program.program.shortDescription || program.program.longDescription || '',
      poster_path: program.program.preferredImage?.uri || '',
      backdrop_path: program.program.preferredImage?.uri || '',
      vote_average: 0,
      media_type: 'tv' as const,
      genre_ids: [],
      popularity: 0,
      first_air_date: program.program.origAirDate || new Date().toISOString().split('T')[0],
    };

    onItemClick(searchResult);
  };

  const isCurrentProgram = (program: MockProgram): boolean => {
    const startTime = new Date(program.startTime);
    const endTime = new Date(program.endTime);
    return currentTime >= startTime && currentTime <= endTime;
  };

  const getLogoUrl = (channel: MockChannelSchedule): string => {
    // First try to get from channel's preferredImage
    if (channel.preferredImage?.uri && channel.preferredImage.uri.trim() !== '') {
      return channel.preferredImage.uri;
    }
    
    // More reliable logo URLs using direct image sources with better fallbacks
    const networkLogos: {[key: string]: string} = {
      // Broadcast Networks
      'CBS': 'https://logos-world.net/wp-content/uploads/2020/06/CBS-Logo.png',
      'NBC': 'https://logos-world.net/wp-content/uploads/2020/06/NBC-Logo.png', 
      'ABC': 'https://logos-world.net/wp-content/uploads/2020/06/ABC-Logo.png',
      'FOX': 'https://logos-world.net/wp-content/uploads/2020/06/Fox-Broadcasting-Company-Logo.png',
      'PBS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/PBS_logo.svg/240px-PBS_logo.svg.png',
      'CW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_CW.svg/240px-The_CW.svg.png',
      
      // News Networks  
      'CNN': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/240px-CNN.svg.png',
      'FOX News': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/240px-Fox_News_Channel_logo.svg.png',
      'MSNBC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/MSNBC_logo.svg/240px-MSNBC_logo.svg.png',
      'CNBC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/240px-CNBC_logo.svg.png',
      
      // Sports Networks
      'ESPN': 'https://logoeps.com/wp-content/uploads/2013/03/espn-vector-logo.png',
      'ESPN2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/ESPN2_logo.svg/240px-ESPN2_logo.svg.png',
      'FS1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Fox_Sports_1_logo.svg/240px-Fox_Sports_1_logo.svg.png',
      'NFL Network': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/95/NFL_Network_logo.svg/240px-NFL_Network_logo.svg.png',
      'NBA TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/NBA_TV.svg/240px-NBA_TV.svg.png',
      
      // Entertainment Networks
      'AMC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/AMC_logo_2016.svg/240px-AMC_logo_2016.svg.png',
      'FX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/FX_International_logo.svg/240px-FX_International_logo.svg.png',
      'USA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/USA_Network_logo_%282016%29.svg/240px-USA_Network_logo_%282016%29.svg.png',
      'TNT': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/TNT_Logo_2016.svg/240px-TNT_Logo_2016.svg.png',
      'TBS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/TBS_logo_2016.svg/240px-TBS_logo_2016.svg.png',
      
      // Documentary & Educational
      'History': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Logo.svg/240px-History_Logo.svg.png',
      'Discovery': 'https://logos-world.net/wp-content/uploads/2021/05/Discovery-Channel-Logo.png',
      'National Geographic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/National_Geographic_Channel.svg/240px-National_Geographic_Channel.svg.png',
      'Animal Planet': 'https://logos-world.net/wp-content/uploads/2021/05/Animal-Planet-Logo.png',
      'Science Channel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Science_Channel_logo.svg/240px-Science_Channel_logo.svg.png',
      
      // Comedy Networks
      'Comedy Central': 'https://logos-world.net/wp-content/uploads/2021/05/Comedy-Central-Logo.png',
      'Adult Swim': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Adult_Swim_2003_logo.svg/240px-Adult_Swim_2003_logo.svg.png',
      
      // Kids & Family  
      'Disney Channel': 'https://logos-world.net/wp-content/uploads/2021/05/Disney-Channel-Logo.png',
      'Nickelodeon': 'https://logos-world.net/wp-content/uploads/2021/05/Nickelodeon-Logo.png',
      'Cartoon Network': 'https://logos-world.net/wp-content/uploads/2021/05/Cartoon-Network-Logo.png',
      
      // Lifestyle Networks
      'HGTV': 'https://logos-world.net/wp-content/uploads/2021/05/HGTV-Logo.png',
      'Food Network': 'https://logos-world.net/wp-content/uploads/2021/05/Food-Network-Logo.png',
      'Travel Channel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Travel_Channel_Logo_2018.svg/240px-Travel_Channel_Logo_2018.svg.png',
      'TLC': 'https://logos-world.net/wp-content/uploads/2021/05/TLC-Logo.png',
      'Bravo': 'https://logos-world.net/wp-content/uploads/2021/05/Bravo-Logo.png',
      
      // Music Networks
      'MTV': 'https://logos-world.net/wp-content/uploads/2021/05/MTV-Logo.png',
      'VH1': 'https://logos-world.net/wp-content/uploads/2021/05/VH1-Logo.png',  
      'CMT': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/CMT_2017_logo.svg/240px-CMT_2017_logo.svg.png',
      
      // Premium Networks
      'HBO': 'https://logos-world.net/wp-content/uploads/2022/01/HBO-Logo.png',
      'Showtime': 'https://logos-world.net/wp-content/uploads/2022/01/Showtime-Logo.png',
      'Starz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Starz_2016.svg/240px-Starz_2016.svg.png',
      
      // Additional Networks
      'Syfy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Syfy.svg/240px-Syfy.svg.png',
      'A&E': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/A%26E_Network_logo.svg/240px-A%26E_Network_logo.svg.png',
      'Lifetime': 'https://logos-world.net/wp-content/uploads/2021/05/Lifetime-Logo.png',
      'E!': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/E%21_Logo.svg/240px-E%21_Logo.svg.png',
      'Oxygen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Oxygen_TV_Logo.svg/240px-Oxygen_TV_Logo.svg.png',
      'ID': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Investigation_Discovery_Logo_2018.svg/240px-Investigation_Discovery_Logo_2018.svg.png',
      'Weather Channel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/The_Weather_Channel_logo_2005-2013.svg/240px-The_Weather_Channel_logo_2005-2013.svg.png',
      'BET': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/BET_logo_%282017%29.svg/240px-BET_logo_%282017%29.svg.png',
      'OWN': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Own_logo_2011.svg/240px-Own_logo_2011.svg.png',
      'Hallmark': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Hallmark_Channel.svg/240px-Hallmark_Channel.svg.png',
      'ION': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Ion_logo.svg/240px-Ion_logo.svg.png',
      'Paramount Network': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Paramount_Network_logo.svg/240px-Paramount_Network_logo.svg.png',
      'truTV': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/TruTV_2014_logo.svg/240px-TruTV_2014_logo.svg.png',
      'IFC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/IFC_Logo.svg/240px-IFC_Logo.svg.png'
    };
    
    // Try multiple fallback strategies
    let logoUrl = networkLogos[channel.callSign] || 
                  networkLogos[channel.callSign.replace(/\s+/g, '')] || // Try without spaces
                  networkLogos[channel.callSign.replace(/\s+/g, ' ').trim()]; // Normalize spaces
    
    // If still no logo found, create a more attractive placeholder
    if (!logoUrl) {
      const shortName = channel.callSign.length > 8 ? 
        channel.callSign.substring(0, 3) : 
        channel.callSign.substring(0, Math.min(8, channel.callSign.length));
      logoUrl = `https://via.placeholder.com/120x80/1f2937/ffffff?text=${encodeURIComponent(shortName)}`;
    }
    
    return logoUrl;
  };

  const renderLocationInfo = () => {
    if (!userLocation) return null;
    
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <MapPin className="w-4 h-4" />
        <span>{userLocation.city}, {userLocation.state}</span>
        {selectedFilter !== 'all-providers' && (
          <>
            <span className="text-gray-600">•</span>
            <span>{TV_PROVIDERS.find(p => p.id === selectedFilter)?.name || 'All Providers'}</span>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading TV Guide...</p>
            <p className="text-sm text-gray-500 mt-2">Detecting your location and loading channels</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-black/20 backdrop-blur-sm rounded-2xl border border-red-500/20">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error Loading TV Guide</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadTVGuideData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Location and Provider Info */}
      {renderLocationInfo()}

      {/* TV Guide Grid */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
        {/* Time Header - Horizontally Scrollable */}
        <div className="sticky top-0 bg-black/60 backdrop-blur-sm border-b border-gray-800/50 z-10">
          <div className="flex">
            {/* Fixed Channel Column Header */}
            <div className="w-32 p-4 flex-shrink-0 text-center text-sm font-medium text-gray-400 border-r border-gray-800/50">
              Channel
            </div>
            
            {/* Scrollable Time Slots Header */}
            <div 
              ref={timeScrollRef}
              className="flex-1 overflow-x-auto scrollbar-hide"
              onScroll={(e) => {
                // Sync scroll with all channel content
                syncHorizontalScroll(e.currentTarget.scrollLeft);
              }}
            >
              <div className="flex" style={{ width: `${timeSlots.length * 150}px` }}>
                {timeSlots.map((slot, index) => (
                  <div 
                    key={index} 
                    className="w-[150px] p-4 text-center text-sm font-medium text-gray-400 border-r border-gray-800/30 flex-shrink-0"
                  >
                    <div>{formatTime(slot)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {slot.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Channel Schedule Grid - Vertically Scrollable */}
        <div className="overflow-y-auto max-h-[600px] scrollbar-hide">
          {tvGuideData.slice(0, channelsToShow).map((channel, channelIndex) => (
            <div 
              key={channel.stationId} 
              className={`flex h-20 min-h-[5rem] border-b border-gray-800/30 hover:bg-purple-500/5 transition-colors ${
                channelIndex % 2 === 0 ? 'bg-black/10' : 'bg-transparent'
              }`}
            >
              {/* Enhanced Channel Info Column - Better logo display and reliability */}
              <div className="w-32 p-1.5 flex-shrink-0 border-r border-gray-800/50 relative overflow-hidden">
                {/* Channel Logo Background - Enhanced with better sizing and fallbacks */}
                <div 
                  className="absolute inset-2 bg-contain bg-center bg-no-repeat opacity-90 rounded"
                  style={{
                    backgroundImage: `url(${getLogoUrl(channel)})`,
                    backgroundSize: 'contain',
                    filter: 'brightness(1.1) contrast(1.05)'
                  }}
                  onError={(e) => {
                    // If image fails to load, show placeholder
                    const target = e.target as HTMLDivElement;
                    target.style.backgroundImage = `url(https://via.placeholder.com/120x80/1f2937/ffffff?text=${encodeURIComponent(channel.callSign.substring(0, 3))})`;
                  }}
                />
                
                {/* Channel Information Overlay */}
                <div className="relative z-20 h-full flex flex-col justify-between pointer-events-none">
                  {/* Channel Call Sign - Top Left */}
                  <div className="text-left">
                    <div className="text-xs font-bold text-white bg-black/95 px-1.5 py-0.5 rounded backdrop-blur-sm inline-block leading-tight max-w-[85px] overflow-hidden shadow-xl border border-white/10">
                      <div className="truncate">{channel.callSign}</div>
                    </div>
                  </div>
                  
                  {/* Channel Number - Bottom Right */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-white bg-black/95 px-1.5 py-0.5 rounded backdrop-blur-sm inline-block shadow-xl border border-white/10">
                      {channel.channel}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Fallback Background for Missing Logos */}
                <div className="absolute inset-2 bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center rounded border border-purple-500/20 opacity-30">
                  <div className="text-sm font-bold text-white/60">
                    {channel.callSign.length > 8 ? channel.callSign.substring(0, 3) : channel.callSign.substring(0, 4)}
                  </div>
                </div>
              </div>

              {/* Scrollable Program Schedule */}
              <div 
                ref={(el) => {
                  channelScrollRefs.current[channelIndex] = el;
                }}
                className="flex-1 overflow-x-auto scrollbar-hide"
                onScroll={(e) => {
                  // Sync scroll with all other containers
                  syncHorizontalScroll(e.currentTarget.scrollLeft, channelIndex);
                }}
              >
                <div className="relative h-20" style={{ width: `${timeSlots.length * 150}px` }}>
                  {/* Render programs with dynamic widths */}
                  {channel.airings.map((program, programIndex) => {
                    const startSlotIndex = getStartingSlotIndex(program.startTime);
                    const programWidth = calculateProgramWidth(program.startTime, program.endTime);
                    
                    // Skip if program doesn't fall within our time window
                    if (startSlotIndex === -1 || startSlotIndex >= timeSlots.length) {
                      return null;
                    }

                    const leftPosition = startSlotIndex * 150;
                    const width = programWidth * 150 - 4; // Subtract for gap

                    return (
                      <button
                        key={programIndex}
                        onClick={() => handleProgramClick(program)}
                        className={`absolute top-2 bottom-2 p-2 rounded-lg text-left transition-all hover:scale-[1.02] hover:z-10 ${
                          isCurrentProgram(program)
                            ? 'bg-purple-600/20 border border-purple-500/40 shadow-lg'
                            : 'bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/30'
                        }`}
                        style={{
                          left: `${leftPosition + 2}px`,
                          width: `${width}px`,
                        }}
                      >
                        <div className="h-full flex flex-col justify-between space-y-1 overflow-hidden">
                          <div className="flex-1 min-h-0 overflow-hidden">
                            <div className={`text-xs font-medium leading-tight break-words max-h-6 overflow-hidden ${
                              isCurrentProgram(program) ? 'text-purple-300' : 'text-white'
                            }`}>
                              {program.program.title || program.program.title === '' ? (program.program.title || 'Programming') : 'Programming'}
                            </div>
                            
                            {program.program.episodeTitle && (
                              <div className="text-xs text-gray-400 leading-tight break-words max-h-4 overflow-hidden mt-1">
                                {program.program.episodeTitle}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs flex-wrap">
                              <span className="text-gray-500">
                                {formatTime(new Date(program.startTime))} - {formatTime(new Date(program.endTime))}
                              </span>
                              
                              {program.ratings && program.ratings[0] && (
                                <span className="px-1 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300">
                                  {program.ratings[0].code}
                                </span>
                              )}
                              
                              {program.qualifiers?.includes('New') && (
                                <span className="px-1 py-0.5 bg-green-600/20 text-green-400 rounded text-xs font-medium">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Time slot grid lines for visual reference */}
                  {timeSlots.map((_, index) => (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 border-r border-gray-800/20 pointer-events-none"
                      style={{ left: `${index * 150}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 p-4 bg-black/10 backdrop-blur-sm rounded-xl border border-gray-800/30">
        <div className="text-sm text-gray-400 text-center">
          Showing {Math.min(channelsToShow, tvGuideData.length)} of {tvGuideData.length} channels
        </div>
        
        <div className="flex items-center gap-3">
          {channelsToShow < tvGuideData.length && (
            <button
              onClick={() => setChannelsToShow(prev => Math.min(tvGuideData.length, prev + 50))}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-lg text-purple-300 transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95"
            >
              <ChevronDown className="w-4 h-4" />
              <span className="whitespace-nowrap">
                Show More ({Math.min(50, tvGuideData.length - channelsToShow)})
              </span>
            </button>
          )}
          
          {channelsToShow > 50 && (
            <button
              onClick={() => setChannelsToShow(prev => Math.max(50, prev - 50))}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 rounded-lg text-gray-300 transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="whitespace-nowrap">Show Less</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <p>Mock TV listings for demonstration • 24-hour guide • Updated every 15 minutes</p>
        <p>
          {timeSlots.length} time slots covering next 24 hours
          {userLocation && (
            <span> • Location: {userLocation.city}, {userLocation.state}</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default LiveTVGuideTab; 