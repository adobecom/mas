/**
 * A complete mock of the Store service for testing
 */
export class StoreMock {
  constructor() {
    this._state = {
      placeholders: {
        list: {
          data: [],
          loading: false
        }
      },
      search: {
        path: ''
      },
      filters: {
        tags: [],
        locale: 'en_US'
      },
      fragments: {
        list: {
          data: [],
          loading: false
        }
      },
      folders: {
        loaded: false,
        data: []
      },
      page: 'placeholders'
    };
    
    this._subscriptions = new Map();
    this._nextId = 1;
    
    // Create reactive store structure
    this.placeholders = this._createReactiveSection('placeholders');
    this.search = this._createReactiveProperty('search');
    this.filters = this._createReactiveProperty('filters');
    this.fragments = this._createReactiveSection('fragments');
    this.folders = this._createReactiveSection('folders');
    this.page = this._createReactiveProperty('page');
    
    // Track all subscriptions for cleanup
    this._allSubscriptions = [];
  }
  
  /**
   * Creates a reactive property with get/set/subscribe
   */
  _createReactiveProperty(path) {
    const self = this;
    return {
      get: () => {
        const parts = path.split('.');
        let current = self._state;
        for (const part of parts) {
          current = current[part];
        }
        return current;
      },
      set: (value) => {
        const parts = path.split('.');
        let current = self._state;
        const lastPart = parts.pop();
        
        for (const part of parts) {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        if (typeof value === 'function') {
          current[lastPart] = value(current[lastPart]);
        } else {
          current[lastPart] = value;
        }
        
        // Ensure arrays remain arrays after updates
        if (Array.isArray(current[lastPart])) {
          // Handle special case for tags
          if (path === 'filters.tags' && !Array.isArray(current[lastPart])) {
            current[lastPart] = current[lastPart] ? 
              current[lastPart].split(',') : [];
          }
        }
        
        // Notify subscribers
        this._notifySubscribers(path);
        return current[lastPart];
      },
      subscribe: (callback) => {
        const id = this._nextId++;
        if (!this._subscriptions.has(path)) {
          this._subscriptions.set(path, new Map());
        }
        this._subscriptions.get(path).set(id, callback);
        
        // Create subscription object
        const subscription = {
          unsubscribe: () => {
            if (this._subscriptions.has(path)) {
              this._subscriptions.get(path).delete(id);
            }
          },
        };
        
        // Track for cleanup
        this._allSubscriptions.push(subscription);
        
        return subscription;
      },
      // Additional methods for metadata
      getMeta: (key) => null,
      setMeta: (key, value) => {},
      removeMeta: (key) => {}
    };
  }
  
  /**
   * Creates a section with nested reactive properties
   */
  _createReactiveSection(sectionPath) {
    const result = {};
    const section = this._state[sectionPath];
    
    for (const key in section) {
      if (typeof section[key] === 'object') {
        result[key] = {};
        for (const subKey in section[key]) {
          const fullPath = `${sectionPath}.${key}.${subKey}`;
          result[key][subKey] = this._createReactiveProperty(fullPath);
        }
      } else {
        const fullPath = `${sectionPath}.${key}`;
        result[key] = this._createReactiveProperty(fullPath);
      }
    }
    
    return result;
  }
  
  /**
   * Notifies subscribers of changes
   */
  _notifySubscribers(path) {
    if (this._subscriptions.has(path)) {
      const value = this._createReactiveProperty(path).get();
      for (const callback of this._subscriptions.get(path).values()) {
        if (typeof callback === 'function') {
          callback(value);
        }
      }
    }
  }
  
  /**
   * Safely cleans up all subscriptions
   */
  cleanupSubscriptions() {
    // Create defensive copy to avoid modification during iteration
    const subscriptions = [...this._allSubscriptions];
    
    // Unsubscribe each subscription
    for (const sub of subscriptions) {
      if (sub && typeof sub.unsubscribe === 'function') {
        try {
          sub.unsubscribe();
        } catch (e) {
          console.warn('Error during unsubscribe:', e);
        }
      }
    }
    
    // Clear all subscriptions
    this._allSubscriptions = [];
    this._subscriptions.clear();
  }
  
  /**
   * Resets the store to initial state
   */
  reset() {
    this._state = {
      placeholders: {
        list: {
          data: [],
          loading: false
        }
      },
      search: {
        path: ''
      },
      filters: {
        tags: [],
        locale: 'en_US'
      },
      fragments: {
        list: {
          data: [],
          loading: false
        }
      },
      folders: {
        loaded: false,
        data: []
      },
      page: 'placeholders'
    };
    
    // Clean up all subscriptions
    this.cleanupSubscriptions();
  }
} 