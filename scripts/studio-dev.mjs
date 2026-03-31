import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import getPort, { makeRange } from 'get-port';

const PROJECT_ROOT = process.cwd();
const STUDIO_DIR = path.join(PROJECT_ROOT, 'studio');
const DEFAULT_PROXY_PORT = 8080;
const DEFAULT_RELAY_PORT = 3000;
const DEFAULT_APP_PORT = 3000;
const AEM_PORT_SEARCH_SPAN = 50;

const envName = process.argv[2] || 'prod';

const proxyTargets = {
    prod: 'https://author-p22655-e59433.adobeaemcloud.com',
    qa: 'https://author-p22655-e155390.adobeaemcloud.com',
    stage: 'https://author-p22655-e59471.adobeaemcloud.com',
};

if (!proxyTargets[envName]) {
    console.error(`Unknown studio environment: ${envName}`);
    process.exit(1);
}

const parsePort = (value, fallback) => {
    const port = Number.parseInt(value ?? '', 10);
    return Number.isInteger(port) && port > 0 ? port : fallback;
};

const proxyPort = parsePort(process.env.PROXY_PORT, DEFAULT_PROXY_PORT);
const relayPort = parsePort(process.env.RELAY_PORT, DEFAULT_RELAY_PORT);
const preferredAppPort = parsePort(process.env.AEM_PORT, DEFAULT_APP_PORT);
const appPort = await getPort({
    port: makeRange(preferredAppPort, preferredAppPort + AEM_PORT_SEARCH_SPAN),
});

const query = new URLSearchParams();
if (proxyPort !== DEFAULT_PROXY_PORT) query.set('proxy.port', String(proxyPort));
if (relayPort !== DEFAULT_RELAY_PORT) query.set('relay.port', String(relayPort));

const studioUrl = `http://localhost:${appPort}/studio.html${query.size ? `?${query.toString()}` : ''}`;

const isPortOpen = (port) =>
    new Promise((resolve) => {
        const socket = net.connect({ host: '127.0.0.1', port }, () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('error', () => resolve(false));
    });

const proxyAlreadyRunning = await isPortOpen(proxyPort);

if (proxyAlreadyRunning) {
    try {
        const response = await fetch(`http://127.0.0.1:${proxyPort}/__studio__/health`);
        if (!response.ok) throw new Error(`health check returned ${response.status}`);

        const proxyInfo = await response.json();
        if (proxyInfo.targetOrigin !== proxyTargets[envName]) {
            console.error(
                `[M@S Studio] localhost:${proxyPort} is already serving ${proxyInfo.targetOrigin}. ` +
                    `Set PROXY_PORT to a different shared port or reuse the matching studio:* command.`,
            );
            process.exit(1);
        }
    } catch (error) {
        console.error(
            `[M@S Studio] localhost:${proxyPort} is already in use, but it does not look like the shared Studio proxy (${error.message}).`,
        );
        process.exit(1);
    }
}

if (!proxyAlreadyRunning) {
    const proxyProcess = spawn(process.execPath, ['./proxy-server.mjs', proxyTargets[envName]], {
        cwd: STUDIO_DIR,
        env: {
            ...process.env,
            PROXY_PORT: String(proxyPort),
        },
        stdio: 'inherit',
    });

    proxyProcess.on('error', (error) => {
        console.error(`Failed to start shared proxy: ${error.message}`);
        process.exit(1);
    });
}

console.info(`[M@S Studio] shared proxy: http://localhost:${proxyPort}`);
console.info(`[M@S Studio] relay port: http://localhost:${relayPort}`);
console.info(`[M@S Studio] worktree studio URL: ${studioUrl}`);

const aemProcess = spawn('aem', ['up', '--port', String(appPort)], {
    cwd: PROJECT_ROOT,
    env: process.env,
    stdio: 'inherit',
});

aemProcess.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }

    process.exit(code ?? 0);
});

aemProcess.on('error', (error) => {
    console.error(`Failed to start AEM: ${error.message}`);
    process.exit(1);
});
