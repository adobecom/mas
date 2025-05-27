#!/usr/bin/env node

import { getSimplifiedCardTypes } from './src/utils/variant-reader.js';
import { SpecGenerator } from './src/generators/spec-generator.js';

console.log('🔍 Debugging MCP Server Components...\n');

// Test 1: Check variant reader
console.log('1. Testing variant reader...');
try {
    const cardTypes = getSimplifiedCardTypes();
    console.log('✅ Card types loaded:', cardTypes);
} catch (error) {
    console.log('❌ Variant reader error:', error.message);
}

// Test 2: Check spec generator
console.log('\n2. Testing spec generator...');
try {
    const specGen = new SpecGenerator();
    const testConfig = {
        cardType: 'suggested',
        cardId: 'test-card-id',
        testSuite: 'test-suite',
        elements: {
            title: { selector: '.title' },
            description: { selector: '.description' }
        },
        testTypes: ['css']
    };
    
    const spec = specGen.generateSpecFile(testConfig, 'css');
    console.log('✅ Spec generation successful');
    console.log('Generated spec preview:', spec.substring(0, 200) + '...');
} catch (error) {
    console.log('❌ Spec generator error:', error.message);
    console.log('Stack:', error.stack);
}

console.log('\n🏁 Debug test complete'); 