/**
 * Utility for mocking location.hash and hashchange events
 */
export class HashMock {
  constructor() {
    this.originalHash = window.location.hash;
    this.originalAddEventListener = window.addEventListener;
    this.originalRemoveEventListener = window.removeEventListener;
    this.handlers = [];
    this.defaultValues = new Map();
    
    // Override hash property
    Object.defineProperty(window.location, 'hash', {
      get: () => this._hash,
      set: (value) => {
        const oldValue = this._hash;
        this._hash = value;
        
        // Trigger events if value changed
        if (oldValue !== value) {
          this._triggerHashChangeEvent();
        }
      },
      configurable: true,
    });
    
    // Initialize hash
    this._hash = '';
    
    // Track event handlers
    window.addEventListener = (event, handler) => {
      if (event === 'hashchange') {
        this.handlers.push(handler);
      }
      return this.originalAddEventListener.call(window, event, handler);
    };
    
    window.removeEventListener = (event, handler) => {
      if (event === 'hashchange') {
        const index = this.handlers.indexOf(handler);
        if (index !== -1) {
          this.handlers.splice(index, 1);
        }
      }
      return this.originalRemoveEventListener.call(
        window,
        event,
        handler,
      );
    };
  }
  
  /**
   * Sets a default value for a property
   */
  setDefaultValue(property, value) {
    this.defaultValues.set(property, value);
  }
  
  /**
   * Check if hash value matches default and should be removed
   */
  checkForDefaultValue(hash) {
    if (!hash) return false;
    
    try {
      // Parse hash parts
      const hashParts = hash.replace(/^#/, '').split('&');
      
      for (const part of hashParts) {
        const [key, value] = part.split('=');
        
        // If this key has a default and matches it
        if (this.defaultValues.has(key) && 
            this.defaultValues.get(key) === decodeURIComponent(value)) {
          return true;
        }
      }
    } catch (e) {
      console.warn('Error checking default value:', e);
    }
    
    return false;
  }
  
  /**
   * Restores original window.location
   */
  restore() {
    // Restore original hash property
    Object.defineProperty(window.location, 'hash', {
      value: this.originalHash,
      writable: true,
      configurable: true,
    });
    
    // Restore event listeners
    window.addEventListener = this.originalAddEventListener;
    window.removeEventListener = this.originalRemoveEventListener;
  }
  
  /**
   * Triggers a hashchange event
   */
  _triggerHashChangeEvent() {
    // Create event
    const event = new Event('hashchange');
    
    // Dispatch on window
    window.dispatchEvent(event);
    
    // Call all handlers to ensure they run
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (e) {
        console.error('Error in hashchange handler:', e);
      }
    }
  }
  
  /**
   * Sets hash without triggering event
   */
  setHashSilently(value) {
    this._hash = value;
  }
  
  /**
   * Gets current hash
   */
  getHash() {
    return this._hash;
  }
  
  /**
   * Clears hash
   */
  clearHash() {
    window.location.hash = '';
  }
  
  /**
   * Sets a hash value, clearing it if default
   */
  setHashValue(key, value) {
    // Check if default
    if (this.defaultValues.has(key) && 
        this.defaultValues.get(key) === value) {
      this.clearHash();
      return;
    }
    
    // Set actual hash
    window.location.hash = `${key}=${encodeURIComponent(value)}`;
  }
} 