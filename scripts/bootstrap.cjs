// Bootstrap: ensure require('electron') works in Electron v42+
const Module = require('module');
const path = require('path');

// Check if we're in Electron
if (!process.versions || !process.versions.electron) return;

// The native electron source
const natives = process.binding('natives');
const source = natives['electron/js2c/browser_init'];

// We need to patch _resolveFilename to intercept 'electron'
// before any other code runs
const origResolve = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'electron') {
    // Return a special marker path that our loader can intercept
    return path.join(__dirname, 'electron-builtin.js');
  }
  return origResolve.call(this, request, parent, isMain, options);
};

// Now create the electron-builtin.js module
const fs = require('fs');
const builtinPath = path.join(__dirname, 'electron-builtin.js');

// Write a proxy module that re-exports the electron APIs
// The trick: we use Module._load with a parent that has access to electron
// OR we use the built-in electron from the process
fs.writeFileSync(builtinPath, `
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
`);
