const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('polarisLocal', {
    exit: () => ipcRenderer.send('app-exit'),
    api: (path, method, body) => ipcRenderer.invoke('app-api-request', { path, method, body }),
    getCameraPreview: () => ipcRenderer.invoke('get-camera-preview')
});

// Legacy support if needed, but contextBridge is preferred
window.electron = {
    exit: () => ipcRenderer.send('app-exit')
};
