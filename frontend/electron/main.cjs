const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development';
const HOSTED_URL = "https://polaris7482.netlify.app";

// Path to backend executable or script
const getBackendPath = () => {
    if (isDev) {
        return null;
    } else {
        // In production, it's inside the resources folder
        const exePath = path.join(process.resourcesPath, 'backend', 'polaris-backend.exe');
        return exePath;
    }
};

const startBackend = () => {
    const backendPath = getBackendPath();
    if (!backendPath) {
        console.log('Dev mode: Skipping backend spawn (run it manually)');
        return;
    }

    if (!fs.existsSync(backendPath)) {
        console.error('Backend executable not found at:', backendPath);
        return;
    }

    // Kill any stale/orphaned polaris-backend.exe holding the camera or port 8000
    if (process.platform === 'win32') {
        try {
            execSync('taskkill /F /IM polaris-backend.exe', { stdio: 'ignore' });
        } catch (_) {
            // No stale process running
        }
    }

    console.log('Starting backend from:', backendPath);
    backendProcess = spawn(backendPath, [], {
        cwd: path.dirname(backendPath), // Set CWD to backend dir so it finds assets
        stdio: 'inherit' // Pipe output to console
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
};

// Wait for local backend to be reachable before loading the UI.
// Polls /health every 500ms, gives up after 20 seconds and loads anyway.
const waitForBackend = (callback, retries = 40) => {
    if (retries <= 0) {
        console.warn('Backend did not respond in time — loading UI anyway.');
        callback();
        return;
    }
    fetch('http://localhost:8000/health')
        .then(() => {
            console.log('Local backend is ready.');
            callback();
        })
        .catch(() => {
            setTimeout(() => waitForBackend(callback, retries - 1), 500);
        });
};

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: !isDev, // Fullscreen in prod
        kiosk: !isDev,      // Kiosk mode in prod
        frame: isDev,       // Show frame in dev
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false, // Security: Disable Node integration
            contextIsolation: true, // Security: Enable Context Isolation
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true, // Keep enabled for security
            allowRunningInsecureContent: false
        },
    });

    // Load the app — always open the boot screen first (/boot)
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173/boot');
        mainWindow.webContents.openDevTools();
    } else {
        // Show a brief loading splash while backend warms up
        mainWindow.loadURL(`${HOSTED_URL}/boot`);

        // Handle failed loads (e.g. no internet)
        mainWindow.webContents.on('did-fail-load', () => {
            console.log('Failed to load hosted URL, retrying in 5s...');
            setTimeout(() => {
                mainWindow.loadURL(`${HOSTED_URL}/boot`);
            }, 5000);
        });
    }
};

app.on('ready', () => {
    startBackend();
    // Give backend a moment to spawn, then wait for it to respond
    setTimeout(() => {
        waitForBackend(() => {
            createWindow();
        });
    }, 1500);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', () => {
    if (backendProcess) {
        console.log('Killing backend process...');
        backendProcess.kill();
    }
    if (!isDev && process.platform === 'win32') {
        try {
            execSync('taskkill /F /IM polaris-backend.exe', { stdio: 'ignore' });
        } catch (_) {}
    }
});

// --- IPC Handlers ---

// Secure Exit
ipcMain.on('app-exit', () => {
    console.log('Received exit signal');
    app.quit();
});

// Generic API Proxy (Renderer -> Main -> Local Backend)
ipcMain.handle('app-api-request', async (event, { path, method = 'GET', body }) => {
    console.log(`Proxying request: ${method} ${path}`);
    try {
        const url = `http://localhost:8000${path}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            console.error(`API Error [${path}]:`, response.statusText);
            return { success: false, error: response.statusText, data };
        }
    } catch (error) {
        console.error(`Network Error [${path}]:`, error);
        return { success: false, error: error.message };
    }
});

// Get Camera Preview Proxy (Optional, if needed)
ipcMain.handle('get-camera-preview', async () => {
    // Return the localhost URL. Since we are in the main process, we can't return the stream directly easily.
    // But the renderer can try to load it. If webSecurity blocks it, we might need a proxy.
    // For now, let's return the URL and see if the renderer can handle it via an <img> tag.
    // Note: Mixed Content (HTTPS loading HTTP image) might be blocked.
    return 'http://localhost:8000/camera/stream';
});
