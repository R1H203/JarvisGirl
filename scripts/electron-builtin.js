
// Electron built-in proxy
// This file is loaded by the patched Module._resolveFilename
// when 'electron' is required.

// Try to get the actual electron module
const Module = require('module');
const natives = process.binding('natives');

// Create a minimal electron module wrapper
// We access process.binding for each native API
module.exports = {
  app: {
    isPackaged: false,
    whenReady: () => Promise.resolve(),
    quit: () => process.exit(0),
    getPath: (name) => process.cwd(),
    setAppUserModelId: () => {},
    on: () => {},
  },
  BrowserWindow: null,
  ipcMain: {
    handle: () => {},
    on: () => {},
  },
  screen: null,
  nativeImage: null,
  Tray: null,
  Menu: null,
  shell: { openExternal: () => {} },
};
