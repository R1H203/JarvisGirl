// Electron v42 compatibility wrapper
// This file is the entry point for electron
// It accesses the electron module WITHOUT using require('electron')
// by using process.binding to get the source
const Module = require('module');
const path = require('path');

// Try to load the actual electron module
let electronModule = null;

// Method: Use Module._load with a patched resolver
const origResolve = Module._resolveFilename;

// Patch to intercept 'electron'
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'electron') {
    // Create a synthetic module path
    return path.join(__dirname, 'electron-proxy.cjs');
  }
  return origResolve.call(this, request, parent, isMain, options);
};

// Now we need to create the proxy file
const fs = require('fs');
const proxyPath = path.join(__dirname, 'electron-proxy.cjs');

// Write the proxy
const natives = process.binding('natives');
const elSource = natives['electron/js2c/browser_init'];

fs.writeFileSync(proxyPath, `
// Auto-generated electron proxy
const Module = require('module');
const m = new Module('electron');
m.filename = 'electron';
m.paths = Module._nodeModulePaths(process.cwd());

// Provide minimal missing APIs
if (!process.activateUvLoop) {
  process.activateUvLoop = function() {};
}
if (!process._linkedBinding) {
  process._linkedBinding = process.binding.bind(process);
}

// Try to compile
try {
  // This source has issue with process.activateUvLoop
  // Let's try a different approach - extract only the API objects
  ${elSource}
} catch(e) {
  console.error('Electron proxy error:', e.message);
  // Return minimal module
  module.exports = {};
}

// Clear the cached proxy
delete Module._cache[require.resolve('./electron-proxy.cjs')];
`);

// Now this will trigger the patched resolver
const electron = require('electron');

// Now we have the electron module (or a stub)
// Load the actual app
require(path.join(process.cwd(), 'out/main/index.js'));
