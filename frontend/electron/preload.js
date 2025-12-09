const { ipcRenderer } = require('electron');

window.electron = {
    exit: () => ipcRenderer.send('app-exit')
};
