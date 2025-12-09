const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('polarisLocal', {
    exit: () => ipcRenderer.send('app-exit'),
    startSession: (orderId) => ipcRenderer.invoke('app-start-session', orderId),
    getCameraPreview: () => ipcRenderer.invoke('get-camera-preview')
});

// Legacy support if needed, but contextBridge is preferred
window.electron = {
    exit: () => ipcRenderer.send('app-exit')
};
