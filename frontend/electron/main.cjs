const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
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

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Load Hosted URL in Production
        mainWindow.loadURL(HOSTED_URL);

        // Handle failed loads (e.g. no internet)
        mainWindow.webContents.on('did-fail-load', () => {
            console.log('Failed to load hosted URL, retrying in 5s...');
            setTimeout(() => {
                mainWindow.loadURL(HOSTED_URL);
            }, 5000);
        });
    }
};

app.on('ready', () => {
    startBackend();
    createWindow();
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
});

// --- IPC Handlers ---

// Secure Exit
ipcMain.on('app-exit', () => {
    console.log('Received exit signal');
    app.quit();
});

// Start Session Proxy (Renderer -> Main -> Local Backend)
ipcMain.handle('app-start-session', async (event, orderId) => {
    console.log(`Starting session for order: ${orderId}`);
    try {
        const response = await fetch('http://localhost:8000/session/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
        });

        if (response.ok) {
            return { success: true };
        } else {
            console.error('Failed to start session:', response.statusText);
            return { success: false, error: response.statusText };
        }
    } catch (error) {
        console.error('Error calling local backend:', error);
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
