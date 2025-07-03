import { handleError, handleAsyncError } from './errorHandler';

interface SmartTV {
  id: string;
  name: string;
  brand: string;
  model: string;
  ipAddress: string;
  isConnected: boolean;
  lastSeen: string;
}

interface CommandResult {
  success: boolean;
  error?: string;
  errorType?: 'cors' | 'timeout' | 'network' | 'unauthorized' | 'not_found' | 'unknown';
  troubleshooting?: string[];
}

interface RemoteCommand {
  type: string;
  value?: string | number;
}

class SmartTVService {
  private readonly TIMEOUT = 8000; // Increased to 8 seconds

  /**
   * Test connection to a smart TV
   */
  async testConnection(tv: SmartTV): Promise<boolean> {
    try {
      switch (tv.brand.toLowerCase()) {
        case 'roku':
          return await this.testRokuConnection(tv);
        case 'samsung':
          return await this.testSamsungConnection(tv);
        case 'lg':
          return await this.testLGConnection(tv);
        case 'apple':
          return await this.testAppleTVConnection(tv);
        default:
          handleError('Unsupported TV brand', {
            context: { brand: tv.brand, tvName: tv.name }
          });
          return false;
      }
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'testConnection',
        tvName: tv.name,
        tvBrand: tv.brand
      });
      return false;
    }
  }

  /**
   * Send a command to a smart TV
   */
  async sendCommand(tv: SmartTV, command: string, value?: any): Promise<CommandResult> {
    try {
      switch (tv.brand.toLowerCase()) {
        case 'roku':
          await this.sendRokuCommand(tv, command, value);
          break;
        case 'samsung':
          await this.sendSamsungCommand(tv, command, value);
          break;
        case 'lg':
          await this.sendLGCommand(tv, command, value);
          break;
        case 'apple':
          await this.sendAppleTVCommand(tv, command, value);
          break;
        default:
          handleError('Unsupported TV brand', {
            context: { brand: tv.brand, tvName: tv.name }
          });
          throw new Error('Unsupported TV brand');
      }
      
      return { success: true };
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'sendCommand',
        tvName: tv.name,
        command,
        value
      });
      return this.handleError(error, tv);
    }
  }

  /**
   * Find the correct IP address for a Roku TV
   */
  async findRokuIP(): Promise<string[]> {
    const possibleIPs: string[] = [];
    
    // Try to get network info from browser (limited)
    try {
      // Common Roku IP ranges
      const commonRanges = [
        '192.168.1.',
        '192.168.0.',
        '10.0.0.',
        '172.16.0.'
      ];
      
      // This is limited in browsers - would need a native app or browser extension
      handleError('IP discovery requires network scanning capabilities', {
        context: { message: 'Feature not implemented' }
      });
      return possibleIPs;
    } catch {
      return [];
    }
  }

  private handleError(error: any, tv: SmartTV): CommandResult {
    let errorType: CommandResult['errorType'] = 'unknown';
    let troubleshooting: string[] = [];
    let errorMessage = 'Unknown error occurred';

    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      errorType = 'timeout';
      errorMessage = 'Request timed out - TV not responding';
      troubleshooting = [
        'Verify TV IP address is correct',
        'Ensure TV and device are on the same WiFi network',
        'Check if TV is powered on and connected to network',
        'Try restarting your TV and router'
      ];
    } else if (error.message?.includes('CORS') || error.message?.includes('cross-origin') || error.message?.includes('Failed to fetch')) {
      errorType = 'cors';
      errorMessage = 'Browser security blocks direct TV communication';
      troubleshooting = [
        'Use the official Roku mobile app instead',
        'Install a browser extension that disables CORS',
        'Set up a local proxy server',
        'Use the TV\'s built-in remote or physical remote'
      ];
    } else if (error.message?.includes('Network') || error.message?.includes('network')) {
      errorType = 'network';
      errorMessage = 'Network connection failed';
      troubleshooting = [
        'Check WiFi connection on both devices',
        'Verify TV and device are on same network',
        'Try refreshing the page',
        'Restart your router if needed'
      ];
    } else if (error.message?.includes('401') || error.message?.includes('403')) {
      errorType = 'unauthorized';
      errorMessage = 'TV rejected the command - authorization required';
      troubleshooting = [
        'Enable "External Control" in TV settings',
        'Allow remote connections in TV network settings',
        'Some TVs require pairing first'
      ];
    } else if (error.message?.includes('404') || error.message?.includes('not found')) {
      errorType = 'not_found';
      errorMessage = 'TV not found at this IP address';
      troubleshooting = [
        'Verify the TV\'s IP address in network settings',
        'TV IP may have changed - check router admin panel',
        'Ensure TV is connected to WiFi, not ethernet'
      ];
    }

    // Add brand-specific troubleshooting
    if (tv.brand.toLowerCase() === 'roku') {
      troubleshooting.push(
        'In Roku settings: Settings > System > Advanced system settings > External control > Enable',
        'Find your Roku IP: Settings > Network > About'
      );
    }

    console.error(`Command failed for ${tv.name}:`, errorMessage, error);
    
    return {
      success: false,
      error: errorMessage,
      errorType,
      troubleshooting
    };
  }

  // Private methods for each TV brand

  private async testRokuConnection(tv: SmartTV): Promise<boolean> {
    try {
      const response = await fetch(`http://${tv.ipAddress}:8060/query/device-info`, {
        method: 'GET',
        mode: 'no-cors', // Try to bypass CORS
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      // With no-cors mode, we can't read the response, but no error means success
      return true;
         } catch (error) {
       // If CORS is the issue, the TV might still be reachable
       if (error instanceof Error && error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
         console.warn('CORS blocked the request, but TV might be reachable');
       }
       return false;
     }
  }

  private async testSamsungConnection(tv: SmartTV): Promise<boolean> {
    try {
      const response = await fetch(`http://${tv.ipAddress}:8001/api/v2/`, {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      return true;
    } catch {
      return false;
    }
  }

  private async testLGConnection(tv: SmartTV): Promise<boolean> {
    try {
      const response = await fetch(`http://${tv.ipAddress}:3000/`, {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      return true;
    } catch {
      return false;
    }
  }

  private async testAppleTVConnection(tv: SmartTV): Promise<boolean> {
    // Apple TV requires more complex pairing - this is a placeholder
    handleError('Apple TV connection testing requires additional setup', {
      context: { tvName: tv.name }
    });
    return false;
  }

  private async sendRokuCommand(tv: SmartTV, command: string, value?: any): Promise<void> {
    const baseUrl = `http://${tv.ipAddress}:8060`;
    
    const commandMap: { [key: string]: string } = {
      'up': 'Up',
      'down': 'Down',
      'left': 'Left', 
      'right': 'Right',
      'ok': 'Select',
      'back': 'Back',
      'home': 'Home',
      'play_pause': 'Play',
      'rewind': 'Rev',
      'fast_forward': 'Fwd',
      'volume_up': 'VolumeUp',
      'volume_down': 'VolumeDown',
      'mute': 'VolumeMute',
      'power': 'PowerOff'
    };

    const rokuCommand = commandMap[command];
    if (!rokuCommand) {
      throw new Error(`Unknown Roku command: ${command}`);
    }

    try {
      if (command === 'launch_app') {
        // For app launching, we'd need to map app names to Roku channel IDs
        const appChannelMap: { [key: string]: string } = {
          'Netflix': '12',
          'YouTube': '837',
          'Disney+': '291097',
          'Hulu': '2285',
          'Prime Video': '13',
          'Spotify': '22297',
          'HBO Max': '61322'
        };
        
        const channelId = appChannelMap[value];
        if (!channelId) {
          throw new Error(`App "${value}" not found for Roku`);
        }
        
        const response = await fetch(`${baseUrl}/launch/${channelId}`, {
          method: 'POST',
          mode: 'no-cors', // Bypass CORS restrictions
          signal: AbortSignal.timeout(this.TIMEOUT)
        });
      } else {
        // Send keypress command
        const response = await fetch(`${baseUrl}/keypress/${rokuCommand}`, {
          method: 'POST',
          mode: 'no-cors', // Bypass CORS restrictions
          signal: AbortSignal.timeout(this.TIMEOUT)
        });
      }
      
      // With no-cors mode, we can't check response.ok, so assume success if no error thrown
         } catch (error) {
       // Re-throw with more context for Roku
       if (error instanceof Error && error.name === 'AbortError') {
         throw new Error('Roku TV not responding - check IP address and network connection');
       } else if (error instanceof Error && error.message?.includes('Failed to fetch')) {
         throw new Error('Cannot reach Roku TV - verify IP address and enable External Control in Roku settings');
       }
       throw error;
     }
  }

  private async sendSamsungCommand(tv: SmartTV, command: string, value?: any): Promise<void> {
    const baseUrl = `http://${tv.ipAddress}:8001/api/v2/`;
    
    const commandMap: { [key: string]: string } = {
      'up': 'KEY_UP',
      'down': 'KEY_DOWN', 
      'left': 'KEY_LEFT',
      'right': 'KEY_RIGHT',
      'ok': 'KEY_ENTER',
      'back': 'KEY_RETURN',
      'home': 'KEY_HOME',
      'play_pause': 'KEY_PLAYPAUSE',
      'rewind': 'KEY_REWIND',
      'fast_forward': 'KEY_FF',
      'volume_up': 'KEY_VOLUP',
      'volume_down': 'KEY_VOLDOWN', 
      'mute': 'KEY_MUTE',
      'power': 'KEY_POWER'
    };

    const samsungKey = commandMap[command];
    if (!samsungKey) {
      throw new Error(`Unknown Samsung command: ${command}`);
    }

    const response = await fetch(`${baseUrl}keys/${samsungKey}`, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: samsungKey }),
      signal: AbortSignal.timeout(this.TIMEOUT)
    });
  }

  private async sendLGCommand(tv: SmartTV, command: string, value?: any): Promise<void> {
    // LG WebOS typically requires WebSocket connection and pairing
    // This is a simplified HTTP approach for demonstration
    const commandMap: { [key: string]: string } = {
      'up': 'UP',
      'down': 'DOWN',
      'left': 'LEFT', 
      'right': 'RIGHT',
      'ok': 'ENTER',
      'back': 'BACK',
      'home': 'HOME',
      'play_pause': 'PLAY',
      'volume_up': 'VOLUMEUP',
      'volume_down': 'VOLUMEDOWN',
      'mute': 'MUTE',
      'power': 'POWER'
    };

    try {
      const response = await fetch(`http://${tv.ipAddress}:3000/api/command`, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          command: commandMap[command] || command.toUpperCase(),
          value: value 
        }),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
    } catch (error) {
      // LG TVs often require WebSocket pairing - provide helpful error
      throw new Error('LG TV may require WebSocket pairing. Please enable "Mobile TV On" in TV settings under General > Mobile TV On.');
    }
  }

  private async sendAppleTVCommand(tv: SmartTV, command: string, value?: any): Promise<void> {
    // Apple TV requires companion app pairing or AirPlay
    throw new Error('Apple TV integration requires companion app pairing or AirPlay setup. Please use the official Apple TV Remote app.');
  }

  /**
   * Discover TVs on the network (placeholder - would require actual network scanning)
   */
  async discoverTVs(): Promise<SmartTV[]> {
    // This would typically involve network scanning, mDNS discovery, etc.
    // For now, return empty array as this requires more complex implementation
    handleError('TV discovery requires network scanning implementation', {
      context: { message: 'Feature not implemented' }
    });
    return [];
  }
}

export const smartTVService = new SmartTVService();
export type { SmartTV, CommandResult }; 