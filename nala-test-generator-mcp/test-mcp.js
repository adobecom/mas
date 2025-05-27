#!/usr/bin/env node

import { spawn } from 'child_process';

/**
 * Test the MCP server by calling its tools
 */
async function testMCPServer() {
    console.log('🧪 Testing NALA Test Generator MCP Server...\n');

    // Test 1: Create suggested card example
    console.log('📋 Test 1: Creating suggested card example...');
    const exampleResult = await callMCPTool('create-suggested-card-example', {});
    if (exampleResult.content && exampleResult.content[0].text.includes('suggested')) {
        console.log('✅ Example creation successful\n');
    } else {
        console.log('❌ Example creation failed\n');
        return;
    }

    // Parse the example config from the result
    const exampleText = exampleResult.content[0].text;
    const jsonMatch = exampleText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
        console.log('❌ Could not parse example configuration\n');
        return;
    }

    const exampleConfig = JSON.parse(jsonMatch[1]);

    // Test 2: Generate page object
    console.log('🏗️  Test 2: Generating page object...');
    const pageObjectResult = await callMCPTool('generate-page-object', { config: exampleConfig });
    if (pageObjectResult.content && pageObjectResult.content[0].text.includes('CCDSuggestedPage')) {
        console.log('✅ Page object generation successful\n');
    } else {
        console.log('❌ Page object generation failed\n');
        return;
    }

    // Test 3: Generate test spec
    console.log('📝 Test 3: Generating test specification...');
    const specResult = await callMCPTool('generate-test-spec', { config: exampleConfig });
    if (specResult.content && specResult.content[0].text.includes('FeatureName')) {
        console.log('✅ Test spec generation successful\n');
    } else {
        console.log('❌ Test spec generation failed\n');
        return;
    }

    // Test 4: Generate test implementation
    console.log('🧪 Test 4: Generating CSS test implementation...');
    const testResult = await callMCPTool('generate-test-implementation', { 
        config: exampleConfig, 
        testType: 'css' 
    });
    if (testResult.content && testResult.content[0].text.includes('test.describe')) {
        console.log('✅ Test implementation generation successful\n');
    } else {
        console.log('❌ Test implementation generation failed\n');
        return;
    }

    // Test 5: Generate complete test suite
    console.log('🎯 Test 5: Generating complete test suite...');
    const suiteResult = await callMCPTool('generate-complete-test-suite', { config: exampleConfig });
    if (suiteResult.content && suiteResult.content[0].text.includes('Complete NALA Test Suite')) {
        console.log('✅ Complete test suite generation successful\n');
    } else {
        console.log('❌ Complete test suite generation failed\n');
        return;
    }

    console.log('🎉 All tests passed! The MCP server is working correctly.');
    console.log('\n📚 Next steps:');
    console.log('1. Configure Cursor to use this MCP server (see CURSOR_SETUP.md)');
    console.log('2. Try the commands in Cursor:');
    console.log('   - "Create an example configuration for the suggested card"');
    console.log('   - "Generate a complete test suite for the suggested card example"');
    console.log('3. Customize card configurations for your specific use cases');
}

/**
 * Call an MCP tool and return the result
 * @param {string} toolName 
 * @param {object} args 
 * @returns {Promise<object>}
 */
function callMCPTool(toolName, args) {
    return new Promise((resolve, reject) => {
        const mcp = spawn('node', ['src/index.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const request = {
            jsonrpc: "2.0",
            method: "tools/call",
            params: { name: toolName, arguments: args },
            id: 1
        };

        let output = '';
        let errorOutput = '';

        mcp.stdout.on('data', (data) => {
            const text = data.toString();
            // Filter out the server startup message
            if (!text.includes('NALA Test Generator MCP Server running on stdio')) {
                output += text;
            }
        });

        mcp.stderr.on('data', (data) => {
            const text = data.toString();
            // Filter out the server startup message
            if (!text.includes('NALA Test Generator MCP Server running on stdio')) {
                errorOutput += text;
            }
        });

        mcp.on('close', (code) => {
            if (code === 0 && output.trim()) {
                try {
                    const result = JSON.parse(output.trim());
                    if (result.result) {
                        resolve(result.result);
                    } else if (result.error) {
                        reject(new Error(`MCP Error: ${result.error.message}`));
                    } else {
                        reject(new Error(`Unexpected response: ${output}`));
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse response: ${parseError.message}\nOutput: ${output}`));
                }
            } else {
                reject(new Error(`MCP server exited with code ${code}\nError: ${errorOutput}\nOutput: ${output}`));
            }
        });

        mcp.stdin.write(JSON.stringify(request) + '\n');
        mcp.stdin.end();
    });
}

// Run the tests
testMCPServer().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
}); 