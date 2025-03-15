# Cursor AI Rules for Merch at Scale (MAS)

## Architecture Guidelines

1. **Web Component Pattern**
   - All UI components should be implemented as native Web Components
   - Follow the custom element naming convention with `mas-` prefix
   - Components should be self-contained with minimal external dependencies
   - Avoid suggesting frameworks like React, Vue, or Angular

2. **State Management**
   - Use the custom reactive store system in `store.js`
   - Follow the established patterns for state updates and subscriptions
   - Implement undo/redo capability for content editing operations
   - Ensure state changes are properly tracked for history management

3. **Event System**
   - Use the custom event system for component communication
   - Follow the established event naming conventions
   - Ensure events include appropriate payload data
   - Register event listeners properly with cleanup on component disconnection

4. **Reactivity Pattern**
   - Use the reactivity system in the `reactivity/` directory
   - Follow the observable pattern for reactive properties
   - Implement selective updates to minimize DOM operations
   - Ensure proper cleanup of subscriptions to prevent memory leaks

## Code Style & Patterns

1. **JavaScript Standards**
   - Use ES6+ features but maintain browser compatibility
   - Follow established project patterns for async operations
   - Use ES Modules for code organization
   - Maintain clean separation of concerns

2. **CSS Architecture**
   - Use BEM methodology for component styling
   - Leverage CSS Custom Properties for theming
   - Implement CSS containment for performance optimization
   - Follow the utility-first approach for common patterns

3. **Component Structure**
   - Each component should handle its own initialization, rendering, and cleanup
   - Follow the established lifecycle hooks pattern
   - Implement proper attribute observation
   - Use shadow DOM appropriately for encapsulation

4. **Error Handling**
   - Implement proper error boundaries around component operations
   - Use consistent error reporting patterns
   - Provide meaningful error messages
   - Ensure graceful degradation on failure

## Merchandising-Specific Guidelines

1. **Product Attributes**
   - Support dynamic handling of product attributes (sizes, colors)
   - Implement proper validation for merchandising-specific data
   - Follow established patterns for attribute editors
   - Ensure compatibility with existing product data structures

2. **Fragment Management**
   - Follow the fragment-based approach for content organization
   - Implement proper versioning for content fragments
   - Support the established workflow for fragment creation and editing
   - Maintain compatibility with the repository system

3. **Editor Customization**
   - Follow established patterns for field editor implementation
   - Support the plugin architecture for editor extensions
   - Ensure proper integration with the editor panel
   - Maintain compatibility with existing editor components

## Performance Considerations

1. **Rendering Optimization**
   - Implement virtualized rendering for large content structures
   - Use the custom DOM diffing approach for updates
   - Minimize unnecessary re-renders
   - Follow established patterns for lazy loading

2. **Resource Management**
   - Implement proper resource cleanup to prevent memory leaks
   - Follow established patterns for image and media handling
   - Use appropriate caching strategies
   - Consider background processing for intensive operations

3. **Network Efficiency**
   - Implement incremental updates for large content
   - Follow established patterns for API communication
   - Use appropriate batching for related operations
   - Consider offline capabilities where appropriate

## Security Guidelines

1. **Content Security**
   - Follow established patterns for content validation
   - Implement proper sanitization for user-generated content
   - Respect the permission model for content access
   - Consider content ownership in operations

2. **API Security**
   - Follow established patterns for API authentication
   - Implement proper request validation
   - Use the sandboxing approach for third-party integrations
   - Consider potential security implications of new features

## Integration Guidelines

1. **AEM Integration**
   - Maintain compatibility with AEM content structures
   - Follow established patterns for AEM communication
   - Consider AEM-specific requirements in content models
   - Support the hybrid deployment approach

2. **SWC Integration**
   - Follow established patterns for server-side component integration
   - Maintain compatibility with the SWC rendering model
   - Consider server-side requirements in component design
   - Support the established deployment pipeline

3. **Plugin System**
   - Follow the module-based architecture for plugins
   - Implement proper capability negotiation
   - Support the established event system for plugin communication
   - Consider versioning for plugin API compatibility

## Testing & Quality

1. **Component Testing**
   - Write unit tests for component functionality
   - Follow established patterns for component mocking
   - Test both success and failure scenarios
   - Consider edge cases in merchandising-specific features

2. **Integration Testing**
   - Test component interactions through the event system
   - Verify proper state management across components
   - Test deployment and integration scenarios
   - Consider end-to-end workflows for critical features

3. **Performance Testing**
   - Verify rendering performance for large content structures
   - Test memory usage patterns
   - Consider network efficiency in API interactions
   - Benchmark critical operations against established baselines 