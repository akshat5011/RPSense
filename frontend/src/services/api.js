class RPSenseAPI {
  constructor(baseURL = process.env.NEXT_PUBLIC_ML_SERVER || 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.frameBuffer = [];
    this.isProcessing = false;
    
    console.log(`🌐 RPSenseAPI initialized with baseURL: ${this.baseURL}`);
  }

  /**
   * Add a frame to the buffer
   * @param {string} frameBase64 - Base64 encoded frame
   * @param {Object} metadata - Frame metadata (timestamp, etc.)
   */
  addFrame(frameBase64, metadata = {}) {
    const frame = {
      frame: frameBase64,
      timestamp: Date.now(),
      frameId: this.frameBuffer.length,
      ...metadata
    };
    
    this.frameBuffer.push(frame);
  }

  /**
   * Clear the frame buffer
   */
  clearBuffer() {
    this.frameBuffer = [];
  }

  /**
   * Get current buffer size
   * @returns {number} Number of frames in buffer
   */
  getBufferSize() {
    return this.frameBuffer.length;
  }

  /**
   * Process frames and get game result
   * @param {Object} gameData - Game configuration and state
   * @returns {Promise<Object>} Game result
   */
  async processFrames(gameData = {}) {
    if (this.isProcessing) {
      console.log('⚠️ Already processing frames, ignoring duplicate call');
      return Promise.reject(new Error('Already processing frames'));
    }

    if (this.frameBuffer.length === 0) {
      throw new Error('No frames to process');
    }

    this.isProcessing = true;

    try {
      const response = await fetch(`${this.baseURL}/process-frames`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          frames: this.frameBuffer,
          gameData: gameData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // Clear buffer after successful processing
      this.clearBuffer();
      
      return result;

    } catch (error) {
      console.error('Error processing frames:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Health check
   * @returns {Promise<Object>} Server status
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Set base URL for the API
   * @param {string} url - New base URL
   */
  setBaseURL(url) {
    this.baseURL = url;
  }

  /**
   * Get processing status
   * @returns {boolean} Whether currently processing
   */
  isCurrentlyProcessing() {
    return this.isProcessing;
  }
}

export default RPSenseAPI;
