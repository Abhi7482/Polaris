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

// Path to backend executable or script
const getBackendPath = () => {
    if (isDev) {
        // In dev, we might run python directly, but for simplicity let's assume
        // we run the backend separately in dev, or we could spawn it.
        // For this implementation, we'll assume dev runs backend separately via terminal.
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
            nodeIntegration: true,
            contextIsolation: false, // For simple IPC
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Load the index.html of the app.
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
    startBackend();
    createWindow();
});

// Quit when all windows are closed, except on macOS.
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

// Clean up backend process on quit
app.on('will-quit', () => {
    if (backendProcess) {
        console.log('Killing backend process...');
        backendProcess.kill();
    }
});

// Secure Exit IPC
ipcMain.on('app-exit', () => {
    console.log('Received exit signal');
    app.quit();
});
