#!/usr/bin/env node
/**
 * MAS Web Components File Watcher
 *
 * A zero-dependency file watcher that monitors source files for changes,
 * triggers rebuilds, and optionally sends browser refresh signals via WebSocket.
 *
 * Usage:
 *   npm run watch                    # Build and refresh enabled
 *   npm run dev                      # Build, refresh, AND AEM server (full dev mode)
 *   npm run watch -- --serve         # Same as npm run dev
 *   npm run watch -- --serve --port=8080  # AEM server on custom port
 *   npm run watch -- --no-refresh    # Build only, no WebSocket server
 *   npm run watch -- --no-build      # Refresh server only
 *   npm run watch -- --debounce=500  # Custom debounce timing (ms)
 */

import { watch } from 'fs';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Constants
const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_SERVER_PORT = 3030;
const WEBSOCKET_PORT = 35729;
const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, 'src');

// WebSocket clients
const clients = new Set();

// Child processes to clean up
const childProcesses = [];

// State
let debounceTimer = null;
let buildInProgress = false;
let pendingBuild = false;

/**
 * Parse CLI arguments
 * @returns {{ refresh: boolean, build: boolean, serve: boolean, serverPort: number, debounce: number }}
 */
function parseArgs() {
    const args = process.argv.slice(2);
    return {
        refresh: !args.includes('--no-refresh'),
        build: !args.includes('--no-build'),
        serve: args.includes('--serve'),
        serverPort: parseInt(
            args.find((a) => a.startsWith('--port='))?.split('=')[1] ||
                String(DEFAULT_SERVER_PORT),
            10,
        ),
        debounce: parseInt(
            args.find((a) => a.startsWith('--debounce='))?.split('=')[1] ||
                String(DEFAULT_DEBOUNCE_MS),
            10,
        ),
    };
}

/**
 * Check if a file path should be ignored
 * @param {string} filePath
 * @returns {boolean}
 */
function shouldIgnore(filePath) {
    const ignorePatterns = [
        /node_modules/,
        /[\/\\]dist[\/\\]/,
        /[\/\\]test[\/\\]/,
        /\.test\.js$/,
    ];
    return ignorePatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Run the build process
 * @returns {Promise<boolean>} - true if build succeeded
 */
function runBuild() {
    return new Promise((resolve) => {
        console.log('\x1b[36m[watch]\x1b[0m Building...');
        const start = Date.now();

        const proc = spawn('node', ['./build.mjs'], {
            cwd: __dirname,
            stdio: 'pipe',
        });

        proc.stdout.on('data', (data) => process.stdout.write(data));
        proc.stderr.on('data', (data) => process.stderr.write(data));

        proc.on('close', (code) => {
            const duration = Date.now() - start;
            if (code === 0) {
                console.log(
                    `\x1b[32m[watch]\x1b[0m Build succeeded in ${duration}ms`,
                );
                resolve(true);
            } else {
                console.log(
                    `\x1b[31m[watch]\x1b[0m Build failed with code ${code}`,
                );
                resolve(false);
            }
        });

        proc.on('error', (err) => {
            console.log(`\x1b[31m[watch]\x1b[0m Build error: ${err.message}`);
            resolve(false);
        });
    });
}

/**
 * Start the AEM dev server
 * @param {number} port - Port to run the server on
 * @returns {import('child_process').ChildProcess}
 */
function startDevServer(port) {
    console.log(
        `\x1b[35m[aem]\x1b[0m Starting AEM dev server on http://localhost:${port}...`,
    );

    const proc = spawn('aem', ['up', '--port', String(port)], {
        cwd: join(__dirname, '..'),
        stdio: 'pipe',
        shell: true,
    });

    childProcesses.push(proc);

    proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        lines.forEach((line) => {
            console.log(`\x1b[35m[aem]\x1b[0m ${line}`);
        });
    });

    proc.stderr.on('data', (data) => {
        const output = data.toString();
        // Check for port-in-use errors
        if (
            output.includes('EADDRINUSE') ||
            output.includes('address already in use')
        ) {
            console.error(
                `\x1b[31m[aem]\x1b[0m Port ${port} is already in use.`,
            );
            console.error(
                `\x1b[33m[watch]\x1b[0m   lsof -i :${port}   # Find the process`,
            );
            console.error(
                `\x1b[33m[watch]\x1b[0m   kill <PID>         # Kill it`,
            );
        } else {
            const lines = output.split('\n').filter(Boolean);
            lines.forEach((line) => {
                console.error(`\x1b[35m[aem]\x1b[0m ${line}`);
            });
        }
    });

    proc.on('error', (err) => {
        if (err.code === 'ENOENT') {
            console.error(`\x1b[31m[watch]\x1b[0m AEM CLI not found.`);
            console.error(
                '\x1b[33m[watch]\x1b[0m Install it with: npm install -g @adobe/aem-cli',
            );
        } else {
            console.error(
                `\x1b[31m[watch]\x1b[0m Failed to start AEM server: ${err.message}`,
            );
        }
    });

    proc.on('close', (code) => {
        if (code !== null && code !== 0) {
            console.log(`\x1b[31m[aem]\x1b[0m Server exited with code ${code}`);
        }
    });

    return proc;
}

/**
 * Start the WebSocket refresh server
 * @param {number} port
 * @returns {import('http').Server}
 */
function startRefreshServer(port) {
    const server = createServer((req, res) => {
        // Simple health check endpoint
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
            return;
        }
        res.writeHead(404);
        res.end();
    });

    server.on('upgrade', (req, socket) => {
        const key = req.headers['sec-websocket-key'];
        if (!key) {
            socket.destroy();
            return;
        }

        const accept = createHash('sha1')
            .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
            .digest('base64');

        socket.write(
            [
                'HTTP/1.1 101 Switching Protocols',
                'Upgrade: websocket',
                'Connection: Upgrade',
                `Sec-WebSocket-Accept: ${accept}`,
                '',
                '',
            ].join('\r\n'),
        );

        clients.add(socket);
        console.log(
            `\x1b[36m[watch]\x1b[0m Client connected (${clients.size} active)`,
        );

        socket.on('close', () => {
            clients.delete(socket);
            console.log(
                `\x1b[36m[watch]\x1b[0m Client disconnected (${clients.size} active)`,
            );
        });

        socket.on('error', () => {
            clients.delete(socket);
        });
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(
                `\x1b[31m[watch]\x1b[0m Port ${port} is already in use.`,
            );
            console.error(
                `\x1b[33m[watch]\x1b[0m Another watcher may be running. Try:`,
            );
            console.error(
                `\x1b[33m[watch]\x1b[0m   lsof -i :${port}   # Find the process`,
            );
            console.error(
                `\x1b[33m[watch]\x1b[0m   kill <PID>         # Kill it`,
            );
            process.exit(1);
        } else {
            console.error(
                `\x1b[31m[watch]\x1b[0m WebSocket server error: ${err.message}`,
            );
            process.exit(1);
        }
    });

    server.listen(port, () => {
        console.log(
            `\x1b[36m[watch]\x1b[0m Refresh server on ws://localhost:${port}`,
        );
    });

    return server;
}

/**
 * Send refresh message to all connected WebSocket clients
 */
function sendRefresh() {
    if (clients.size === 0) return;

    const message = JSON.stringify({ command: 'reload' });
    const frame = Buffer.alloc(2 + message.length);
    frame[0] = 0x81; // text frame opcode
    frame[1] = message.length;
    frame.write(message, 2);

    clients.forEach((socket) => {
        try {
            socket.write(frame);
        } catch {
            // Client may have disconnected
            clients.delete(socket);
        }
    });

    console.log(
        `\x1b[36m[watch]\x1b[0m Refresh signal sent to ${clients.size} client(s)`,
    );
}

/**
 * Handle a file change event
 * @param {string} filename
 * @param {{ build: boolean, refresh: boolean }} config
 */
async function handleChange(filename, config) {
    console.log(`\x1b[33m[watch]\x1b[0m Changed: ${filename}`);

    if (buildInProgress) {
        pendingBuild = true;
        console.log(
            '\x1b[33m[watch]\x1b[0m Build in progress, queuing another build...',
        );
        return;
    }

    buildInProgress = true;

    let success = true;
    if (config.build) {
        success = await runBuild();
    }

    if (success && config.refresh) {
        sendRefresh();
    }

    buildInProgress = false;

    // Check if another build was queued while we were building
    if (pendingBuild) {
        pendingBuild = false;
        console.log('\x1b[36m[watch]\x1b[0m Running queued build...');
        handleChange(filename, config);
    }
}

/**
 * Start watching the src directory
 * @param {{ build: boolean, refresh: boolean, debounce: number }} config
 */
function startWatcher(config) {
    try {
        watch(SRC_DIR, { recursive: true }, (eventType, filename) => {
            if (!filename) return;
            if (shouldIgnore(filename)) return;
            if (!filename.endsWith('.js')) return;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                handleChange(filename, config);
            }, config.debounce);
        });
    } catch (err) {
        console.error(
            `\x1b[31m[watch]\x1b[0m Failed to start watcher: ${err.message}`,
        );
        process.exit(1);
    }
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
    const shutdown = () => {
        console.log('\n\x1b[36m[watch]\x1b[0m Shutting down...');

        // Kill all child processes
        childProcesses.forEach((proc) => {
            try {
                proc.kill('SIGTERM');
            } catch {
                // Process may already be dead
            }
        });

        // Close all WebSocket clients
        clients.forEach((socket) => {
            try {
                socket.end();
            } catch {
                // Socket may already be closed
            }
        });

        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

/**
 * Main entry point
 */
async function main() {
    const config = parseArgs();

    // Setup graceful shutdown
    setupGracefulShutdown();

    console.log('');
    console.log('\x1b[36m[watch]\x1b[0m MAS Web Components Watcher');
    console.log(`  Build: ${config.build ? 'enabled' : 'disabled'}`);
    console.log(`  Refresh: ${config.refresh ? 'enabled' : 'disabled'}`);
    console.log(
        `  Serve: ${config.serve ? `enabled (port ${config.serverPort})` : 'disabled'}`,
    );
    console.log(`  Debounce: ${config.debounce}ms`);
    console.log('');

    // Start AEM dev server if --serve flag is provided
    // AEM has its own LiveReload on port 35729, so skip our WebSocket server
    if (config.serve) {
        startDevServer(config.serverPort);
        console.log(
            `\x1b[36m[watch]\x1b[0m AEM will auto-reload when dist/ changes`,
        );
    } else if (config.refresh) {
        // Only start our own WebSocket server when NOT using --serve
        startRefreshServer(WEBSOCKET_PORT);
    }

    startWatcher(config);

    console.log('\x1b[36m[watch]\x1b[0m Watching src/**/*.js for changes...');
    console.log('');
    console.log('\x1b[90mPress Ctrl+C to stop\x1b[0m');
    console.log('');
}

main();
