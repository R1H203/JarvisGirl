// Patch: Fix require('electron') for Electron v42+
// Electron v42 no longer registers 'electron' as a Node.js built-in module,
// so require('electron') resolves to the npm package which returns a path string.
// This script patches Module._resolveFilename to intercept 'electron' and
// return the correct built-in module path from the Electron binary's resources.

const Module = require('module')
const path = require('path')
const fs = require('fs')

const origResolve = Module._resolveFilename

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'electron') {
    // Get the real electron module from the Electron binary's resources
    // In Electron, the module files are asar-packed in resources/app/node_modules/
    // But the built-in 'electron' module lives inside the binary itself.
    // We need to find the actual asar archive path.

    // Try to locate the electron built-in module
    const appPath = path.dirname(process.execPath)
    const resourcesPath = path.join(appPath, 'resources')

    // The built-in electron module files
    const builtInPath = path.join(resourcesPath, 'electron.asar', 'built-in', 'electron')

    // If the asar file exists, return the path
    if (fs.existsSync(builtInPath + '.js')) {
      return builtInPath + '.js'
    }
    if (fs.existsSync(builtInPath + '.mjs')) {
      return builtInPath + '.mjs'
    }

    // Fallback: return a custom wrapper that provides the same API
    // This wrapper uses process._linkedBinding for native bindings
    // and creates a compatible electron module
    return path.join(__dirname, 'electron-shim.js')
  }
  return origResolve.call(this, request, parent, isMain, options)
}
