#!/usr/bin/env node

import { ConfigHandler } from './config-handler.js';

console.log('🔍 Validating Figma to Merch Card MCP Configuration...\n');
console.log(
    'ℹ️  Using environment variables (configured via mcp.json or system)\n',
);

try {
    const configHandler = new ConfigHandler();
    console.log('📁 Configuration paths:');
    console.log(`   Project Root: ${configHandler.getProjectRoot()}`);
    console.log(`   Studio Path: ${configHandler.getStudioPath()}`);
    console.log(`   Web Components: ${configHandler.getWebComponentsPath()}`);
    console.log(`   Variant Picker: ${configHandler.getVariantPickerPath()}`);
    console.log('\n🎨 Testing Figma access token...');
    try {
        const token = configHandler.getFigmaAccessToken();
        console.log(
            `   ✅ Figma token configured (${token.substring(0, 10)}...)`,
        );
    } catch (error) {
        console.log(`   ❌ Figma token error: ${error.message}`);
    }
    console.log('\n🏗️  Build configuration:');
    const buildConfig = configHandler.getBuildConfig();
    console.log(`   Command: ${buildConfig.command}`);
    console.log(`   Timeout: ${buildConfig.timeout}ms`);
    console.log('\n🧪 Testing path resolution...');
    const testPath = configHandler.resolveOutputPath('web-components/src');
    console.log(`   Resolved path: ${testPath}`);
    if (configHandler.validateConfiguration()) {
        console.log('\n🎉 Configuration validation completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npm run quick-start');
        console.log('2. Or use the MCP tools in your client');
        process.exit(0);
    }
} catch (error) {
    console.error('\n❌ Configuration validation failed:');
    console.error(`   ${error.message}`);
    console.log('\n🔧 To fix this:');
    console.log('1. Configure environment variables in your mcp.json:');
    console.log('   "env": {');
    console.log('     "PROJECT_ROOT": "/path/to/your/project",');
    console.log('     "FIGMA_ACCESS_TOKEN": "your_token",');
    console.log('     "OUTPUT_PATH": "web-components/src",');
    console.log('     "STUDIO_PATH": "studio/src",');
    console.log('     "WEB_COMPONENTS_PATH": "web-components"');
    console.log('   }');
    console.log('2. Or set environment variables manually:');
    console.log('   export PROJECT_ROOT="/path/to/your/project"');
    console.log('   export FIGMA_ACCESS_TOKEN="your_token"');
    console.log('3. Ensure your project has the expected structure');
    process.exit(1);
} 