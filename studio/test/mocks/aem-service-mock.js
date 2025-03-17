/**
 * Complete AEM service mock for testing
 */
export class AEMServiceMock {
  constructor(config = {}) {
    this.cfFragmentsUrl = config.baseUrl || '/mock/content/dam/fragments';
    this.headers = { Authorization: 'Bearer mock-token' };
    
    // Define fragment models
    this._fragmentModels = new Map();
    this._fragmentModels.set('test-model', {
      id: 'test-model',
      title: 'Test Model',
    });
    
    // Sites namespace structure
    this.sites = {
      cf: {
        fragments: {
          create: this._createTrackedMethod('create', {
            id: 'mock-fragment-id',
            path: '/content/dam/fragments/mock-fragment',
          }),
          save: this._createTrackedMethod('save', {
            id: 'mock-fragment-id',
          }),
          publish: this._createTrackedMethod('publish', true),
          unpublish: this._createTrackedMethod('unpublish', true),
          delete: this._createTrackedMethod('delete', true),
          search: this._createTrackedMethod('search', []),
          getById: this._createTrackedMethod('getById', {
            id: 'mock-fragment-id',
          }),
          get: this._createTrackedMethod('get', {
            id: 'mock-fragment-id',
          }),
        },
      },
    };
    
    // Folders namespace
    this.folders = {
      list: this._createTrackedMethod('list', {
        children: [
          { name: 'folder1', path: '/content/dam/folder1' },
          { name: 'folder2', path: '/content/dam/folder2' },
        ],
      }),
    };
    
    // Top-level fragment methods - carefully implemented
    this.getFragment = this._createTrackedMethod('getFragment', {
      id: 'mock-fragment-id',
      path: '/content/dam/fragments/mock-fragment',
      fields: [
        { name: 'key', values: ['mock-key'] },
        { name: 'value', values: ['mock-value'] },
      ],
      properties: {
        status: 'Draft',
      },
    });
    
    // Create fragment implementation
    this.createFragment = this._createTrackedMethod('createFragment', {
      id: 'new-fragment-id',
      path: '/content/dam/fragments/new-fragment',
      fields: [
        { name: 'key', values: ['mock-key'] },
        { name: 'value', values: ['mock-value'] },
      ],
    });
    
    // List folders implementation
    this.listFoldersClassic = this._createTrackedMethod('listFoldersClassic', [
      { name: 'folder1', path: '/path/to/folder1' },
      { name: 'folder2', path: '/path/to/folder2' },
    ]);
  }
  
  /**
   * Creates a method with thorough tracking and control capabilities
   */
  _createTrackedMethod(name, defaultResponse) {
    const method = async (...args) => {
      // Track call
      method.callCount += 1;
      method.lastArgs = args;
      method.allArgs.push(args);
      
      // Handle rejection case
      if (method.shouldReject) {
        return Promise.reject(
          method.rejectReason || new Error(`Mock ${name} error`),
        );
      }
      
      // Return response (using nextResponse if available)
      return Promise.resolve(
        method.nextResponse || method.defaultResponse,
      );
    };
    
    // Initialize tracking properties
    method.callCount = 0;
    method.lastArgs = null;
    method.allArgs = [];
    method.defaultResponse = defaultResponse;
    method.nextResponse = null;
    method.shouldReject = false;
    method.rejectReason = null;
    
    // Control methods
    method.resolves = (response) => {
      method.nextResponse = response;
      method.shouldReject = false;
      return method;
    };
    
    method.rejects = (reason) => {
      method.rejectReason = reason;
      method.shouldReject = true;
      return method;
    };
    
    method.reset = () => {
      method.callCount = 0;
      method.lastArgs = null;
      method.allArgs = [];
      method.nextResponse = null;
      method.shouldReject = false;
      method.rejectReason = null;
      return method;
    };
    
    return method;
  }
} 