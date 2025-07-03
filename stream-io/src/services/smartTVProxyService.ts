/**
 * Smart TV Proxy Service
 * Bypasses CORS limitations using WebRTC data channels and local proxy servers
 */

// Removed unused import: handleAsyncError

export interface SmartTV {
  id: string;
  name: string;
  brand: string;
  model: string;
  ipAddress: string;
  isConnected: boolean;
  lastSeen: string;
  capabilities?: string[];
}

interface ProxyCommandResult {
  success: boolean;
  error?: string;
  errorType?: 'cors' | 'timeout' | 'network' | 'unauthorized' | 'not_found' | 'proxy_unavailable' | 'webrtc_failed';
  troubleshooting?: string[];
  method?: 'direct' | 'webrtc' | 'proxy' | 'extension' | 'none';
}

interface WebRTCConnection {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  isConnected: boolean;
}

class SmartTVProxyService {
  private readonly TIMEOUT = 8000;
  private proxyServer: string | null = null;
  private webRTCConnections = new Map<string, WebRTCConnection>();
  private extensionAvailable = false;

  constructor() {
    this.initializeProxyService();
  }

  /**
   * Initialize proxy service and detect available bypass methods
   */
  private async initializeProxyService(): Promise<void> {
    // Check for local proxy server
    await this.detectLocalProxy();
    
    // Check for browser extension
    await this.detectCORSExtension();
    
    // Initialize WebRTC capabilities
    this.initializeWebRTC();
  }

  /**
   * Enhanced connection test with multiple bypass methods
   */
  async testConnection(tv: SmartTV): Promise<boolean> {
    try {
      // Try direct connection first (will likely fail due to CORS)
      const directResult = await this.testDirectConnection(tv);
      if (directResult) return true;

      // Try WebRTC data channel connection
      const webRTCResult = await this.testWebRTCConnection(tv);
      if (webRTCResult) return true;

      // Try proxy server connection
      const proxyResult = await this.testProxyConnection(tv);
      if (proxyResult) return true;

      // Try browser extension method
      const extensionResult = await this.testExtensionConnection(tv);
      if (extensionResult) return true;

      return false;
    } catch {
      console.warn('TV discovery failed, using fallback list');
      return false;
    }
  }

  /**
   * Enhanced command sending with automatic fallback methods
   */
  async sendCommand(tv: SmartTV, command: string, value?: any): Promise<ProxyCommandResult> {
    const attempts: Array<{ method: string; error?: string }> = [];

    // Try WebRTC first (most reliable for bypassing CORS)
    try {
      await this.sendWebRTCCommand(tv, command, value);
      return { success: true, method: 'webrtc' };
    } catch (error) {
      attempts.push({ method: 'webrtc', error: (error as Error).message });
    }

    // Try proxy server
    if (this.proxyServer) {
      try {
        await this.sendProxyCommand(tv, command, value);
        return { success: true, method: 'proxy' };
      } catch (error) {
        attempts.push({ method: 'proxy', error: (error as Error).message });
      }
    }

    // Try browser extension
    if (this.extensionAvailable) {
      try {
        await this.sendExtensionCommand(tv, command, value);
        return { success: true, method: 'extension' };
      } catch (error) {
        attempts.push({ method: 'extension', error: (error as Error).message });
      }
    }

    // Try direct connection (will likely fail but included for completeness)
    try {
      await this.sendDirectCommand(tv, command, value);
      return { success: true, method: 'direct' };
    } catch (error) {
      attempts.push({ method: 'direct', error: (error as Error).message });
    }

    // All methods failed
    return this.generateFailureResult(attempts, tv);
  }

  /**
   * WebRTC Data Channel Implementation
   */
  private async initializeWebRTC(): Promise<void> {
    try {
      // Check if WebRTC is supported
      if (!window.RTCPeerConnection) {
        console.warn('WebRTC not supported in this browser');
        return;
      }

      console.log('WebRTC capabilities initialized');
    } catch {
      console.warn('WebRTC initialization failed');
    }
  }

  private async establishWebRTCConnection(tv: SmartTV): Promise<WebRTCConnection> {
    const existingConnection = this.webRTCConnections.get(tv.id);
    if (existingConnection && existingConnection.isConnected) {
      return existingConnection;
    }

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    const dataChannel = peerConnection.createDataChannel('smarttv-control', {
      ordered: true
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebRTC connection timeout'));
      }, this.TIMEOUT);

      dataChannel.onopen = () => {
        clearTimeout(timeout);
        const connection: WebRTCConnection = {
          peerConnection,
          dataChannel,
          isConnected: true
        };
        this.webRTCConnections.set(tv.id, connection);
        resolve(connection);
      };

      dataChannel.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebRTC data channel error: ${error}`));
      };

      peerConnection.onicecandidateerror = (error: any) => {
        clearTimeout(timeout);
        reject(new Error(`WebRTC ICE candidate error: ${error.errorText}`));
      };

      // Create offer and handle signaling
      peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .catch(reject);
    });
  }

  private async testWebRTCConnection(tv: SmartTV): Promise<boolean> {
    try {
      const connection = await this.establishWebRTCConnection(tv);
      return connection.isConnected;
    } catch {
      console.warn('WebRTC connection failed');
      return false;
    }
  }

  private async sendWebRTCCommand(tv: SmartTV, command: string, value?: any): Promise<void> {
    const connection = await this.establishWebRTCConnection(tv);
    
    const commandData = {
      command,
      value,
      timestamp: Date.now(),
      tvBrand: tv.brand
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebRTC command timeout'));
      }, this.TIMEOUT);

      connection.dataChannel.onmessage = (event) => {
        clearTimeout(timeout);
        const response = JSON.parse(event.data);
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Command failed'));
        }
      };

      connection.dataChannel.send(JSON.stringify(commandData));
    });
  }

  /**
   * Local Proxy Server Implementation
   */
  private async detectLocalProxy(): Promise<void> {
    const proxyPorts = [8080, 3128, 8888, 9999];
    
    for (const port of proxyPorts) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok) {
          this.proxyServer = `http://localhost:${port}`;
          console.log(`Local proxy server detected at ${this.proxyServer}`);
          return;
        }
      } catch {
        // Continue checking other ports
      }
    }
  }

  private async testProxyConnection(tv: SmartTV): Promise<boolean> {
    if (!this.proxyServer) return false;

    try {
      const response = await fetch(`${this.proxyServer}/test-tv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tvIP: tv.ipAddress, 
          tvBrand: tv.brand 
        }),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      return response.ok;
    } catch {
      console.warn('Proxy connection failed');
      return false;
    }
  }

  private async sendProxyCommand(tv: SmartTV, command: string, value?: any): Promise<void> {
    if (!this.proxyServer) {
      throw new Error('No proxy server available');
    }

    const response = await fetch(`${this.proxyServer}/tv-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tvIP: tv.ipAddress,
        tvBrand: tv.brand,
        command,
        value
      }),
      signal: AbortSignal.timeout(this.TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`Proxy command failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Command failed via proxy');
    }
  }

  /**
   * Browser Extension Integration
   */
  private async detectCORSExtension(): Promise<void> {
    try {
      // Check for common CORS-disabling extensions
      const testRequest = await fetch('chrome-extension://cors-anywhere/test', {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      
      if (testRequest.ok) {
        this.extensionAvailable = true;
        console.log('CORS extension detected');
      }
    } catch {
      // Extension not available
      this.extensionAvailable = false;
    }
  }

  private async testExtensionConnection(tv: SmartTV): Promise<boolean> {
    if (!this.extensionAvailable) return false;

    try {
      // Test using extension's CORS bypass
      const testUrl = this.getTestURL(tv);
      const response = await fetch(`chrome-extension://cors-anywhere/${testUrl}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      return response.ok;
    } catch {
      console.warn('Extension connection failed');
      return false;
    }
  }

  private async sendExtensionCommand(tv: SmartTV, command: string, value?: any): Promise<void> {
    if (!this.extensionAvailable) {
      throw new Error('CORS extension not available');
    }

    const commandUrl = this.buildCommandURL(tv, command, value);
    const response = await fetch(`chrome-extension://cors-anywhere/${commandUrl}`, {
      method: 'POST',
      signal: AbortSignal.timeout(this.TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`Extension command failed: ${response.status}`);
    }
  }

  /**
   * Direct Connection (Traditional - Limited by CORS)
   */
  private async testDirectConnection(tv: SmartTV): Promise<boolean> {
    try {
      const testUrl = this.getTestURL(tv);
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      
      // With no-cors, we can't read response, but no error means some connectivity
      return true;
    } catch {
      console.warn('Direct connection failed');
      return false;
    }
  }

  private async sendDirectCommand(tv: SmartTV, command: string, value?: any): Promise<void> {
    const commandUrl = this.buildCommandURL(tv, command, value);
    
    const response = await fetch(commandUrl, {
      method: 'POST',
      mode: 'no-cors',
      signal: AbortSignal.timeout(this.TIMEOUT)
    });

    // With no-cors mode, we can't verify success
    // This is why direct connection is limited
  }

  /**
   * Helper Methods
   */
  private getTestURL(tv: SmartTV): string {
    switch (tv.brand.toLowerCase()) {
      case 'roku':
        return `http://${tv.ipAddress}:8060/query/device-info`;
      case 'samsung':
        return `http://${tv.ipAddress}:8001/api/v2/`;
      case 'lg':
        return `ws://${tv.ipAddress}:3000/`;
      case 'sony':
        return `http://${tv.ipAddress}:80/sony/system`;
      default:
        return `http://${tv.ipAddress}:8080/`;
    }
  }

  private buildCommandURL(tv: SmartTV, command: string, value?: any): string {
    switch (tv.brand.toLowerCase()) {
      case 'roku':
        return this.buildRokuCommand(tv, command, value);
      case 'samsung':
        return this.buildSamsungCommand(tv, command, value);
      case 'lg':
        return this.buildLGCommand(tv, command, value);
      case 'sony':
        return this.buildSonyCommand(tv, command, value);
      default:
        return `http://${tv.ipAddress}:8080/command/${command}`;
    }
  }

  private buildRokuCommand(tv: SmartTV, command: string, value?: any): string {
    const commandMap: Record<string, string> = {
      'power': 'keypress/Power',
      'home': 'keypress/Home',
      'back': 'keypress/Back',
      'up': 'keypress/Up',
      'down': 'keypress/Down',
      'left': 'keypress/Left',
      'right': 'keypress/Right',
      'select': 'keypress/Select',
      'play_pause': 'keypress/Play',
      'volume_up': 'keypress/VolumeUp',
      'volume_down': 'keypress/VolumeDown',
      'mute': 'keypress/VolumeMute'
    };

    const rokuCommand = commandMap[command] || `keypress/${command}`;
    return `http://${tv.ipAddress}:8060/${rokuCommand}`;
  }

  private buildSamsungCommand(tv: SmartTV, command: string, value?: any): string {
    // Samsung TV uses different API endpoints
    return `http://${tv.ipAddress}:8001/api/v2/channels/${command}`;
  }

  private buildLGCommand(tv: SmartTV, command: string, value?: any): string {
    // LG WebOS uses WebSocket, but fallback to HTTP
    return `http://${tv.ipAddress}:3000/command/${command}`;
  }

  private buildSonyCommand(tv: SmartTV, command: string, value?: any): string {
    return `http://${tv.ipAddress}:80/sony/ircc`;
  }

  private generateFailureResult(attempts: Array<{ method: string; error?: string }>, tv: SmartTV): ProxyCommandResult {
    const troubleshooting: string[] = [
      'All connection methods failed. Try these solutions:',
      '1. Install a local proxy server (recommended)',
      '2. Use a CORS-disabling browser extension',
      '3. Use the official TV manufacturer\'s mobile app',
      '4. Enable "Developer Mode" or "External Control" in TV settings'
    ];

    // Add brand-specific troubleshooting
    if (tv.brand.toLowerCase() === 'roku') {
      troubleshooting.push(
        '5. Roku Settings > System > Advanced > External control > Enable',
        '6. Find Roku IP: Settings > Network > About'
      );
    }

    let primaryError = 'Multiple connection methods failed';
    let errorType: ProxyCommandResult['errorType'] = 'cors';

    // Analyze the most relevant error
    const webrtcAttempt = attempts.find(a => a.method === 'webrtc');
    if (webrtcAttempt?.error) {
      primaryError = `WebRTC failed: ${webrtcAttempt.error}`;
      errorType = 'webrtc_failed';
    }

    const proxyAttempt = attempts.find(a => a.method === 'proxy');
    if (proxyAttempt?.error) {
      troubleshooting.unshift('Local proxy server is not running or misconfigured');
      errorType = 'proxy_unavailable';
    }

    return {
      success: false,
      error: primaryError,
      errorType,
      troubleshooting,
      method: 'none'
    };
  }

  /**
   * Setup local proxy server (instructions for users)
   */
  getProxyServerSetupInstructions(): {
    nodeJs: string[];
    python: string[];
    docker: string[];
  } {
    return {
      nodeJs: [
        '1. Install Node.js proxy server:',
        '   npm install -g cors-anywhere',
        '2. Start the proxy:',
        '   cors-anywhere --port 8080',
        '3. Refresh the StreamGuide app'
      ],
      python: [
        '1. Create a simple Python proxy:',
        '   pip install flask flask-cors requests',
        '2. Run the provided proxy script',
        '3. Access via http://localhost:8080'
      ],
      docker: [
        '1. Run CORS proxy via Docker:',
        '   docker run -p 8080:8080 redocly/cors-anywhere',
        '2. Refresh the StreamGuide app'
      ]
    };
  }

  /**
   * Clean up connections
   */
  disconnect(tvId: string): void {
    const connection = this.webRTCConnections.get(tvId);
    if (connection) {
      connection.dataChannel.close();
      connection.peerConnection.close();
      this.webRTCConnections.delete(tvId);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    proxyAvailable: boolean;
    webRTCAvailable: boolean;
    extensionAvailable: boolean;
    activeConnections: number;
  } {
    return {
      proxyAvailable: !!this.proxyServer,
      webRTCAvailable: !!window.RTCPeerConnection,
      extensionAvailable: this.extensionAvailable,
      activeConnections: this.webRTCConnections.size
    };
  }


}

export const smartTVProxyService = new SmartTVProxyService(); 