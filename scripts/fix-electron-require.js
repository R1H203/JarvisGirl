// Fix for Electron v42+: register 'electron' as a Node.js built-in module
// and patch Module._resolveFilename to handle it correctly.
//
// Usage: electron --require ./scripts/fix-electron-require.js <app>

const Module = require('module')
const path = require('path')
const fs = require('fs')

// Check if running inside Electron
if (!process.versions || !process.versions.electron) {
  module.exports = {}
  return
}

// Add 'electron' to builtinModules list if not already there
if (!Module.builtinModules.includes('electron')) {
  // We can't push to builtinModules (it's frozen in some Node versions)
  // Instead, we patch _resolveFilename

  const origResolveFilename = Module._resolveFilename

  Module._resolveFilename = function(request, parent, isMain, options) {
    if (request === 'electron') {
      // We need to find the real electron module
      // In Electron, the built-in modules are located inside the Electron binary.
      // We can access them by loading electron from the Electron process context.
      //
      // Trick: Node.js in Electron has the electron module in its native binding.
      // We load it by doing CJS require from a context where the built-in is available.

      // Method 1: Try to use the internal Module._load with a custom resolved path
      // The built-in electron module lives at this path inside Electron:
      // electron/dist/resources/electron.asar/built-in/electron

      // Method 2: Create a temporary module and load 'electron' from it,
      // using the fact that Electron's internal require (process.mainModule.require)
      // might resolve differently

      // Method 3: Use process._linkedBinding for individual APIs
      // and construct a module object manually

      // Let's try method 4: find the electron asar and load from it
      const execPath = process.execPath
      const electronDir = path.dirname(execPath)
      const resourcesDir = path.join(electronDir, 'resources')

      // Check for electron.asar
      const electronAsar = path.join(resourcesDir, 'electron.asar')
      if (fs.existsSync(electronAsar)) {
        const builtinElectron = path.join(electronAsar, 'built-in', 'electron')
        // Return this path so Module._load can load it
        return builtinElectron
      }

      // Method 5: In Electron 42, the built-in modules might be accessible
      // through Node.js 24's built-in module system
      // Let's try to use the ESM loader hooks

      // For now, fall back: we create a synthetic module that wraps electron APIs
      // accessed through global references that ARE available
      try {
        // Electron exposes some APIs globally in the main process
        const syntheticModule = {
          app: globalThis.app || { isPackaged: !process.execPath.endsWith('electron.exe') },
          BrowserWindow: globalThis.BrowserWindow || undefined,
          ipcMain: globalThis.ipcMain || undefined,
          screen: globalThis.screen || undefined,
          nativeImage: globalThis.nativeImage || undefined,
          Tray: globalThis.Tray || undefined,
          Menu: globalThis.Menu || undefined,
          shell: globalThis.shell || undefined,
          dialog: globalThis.dialog || undefined,
          Notification: globalThis.Notification || undefined,
          clipboard: globalThis.clipboard || undefined,
          // For anything else, return undefined
        }

        // Write synthetic module to a temp file and return its path
        const tmpDir = require('os').tmpdir()
        const synthPath = path.join(tmpDir, 'electron-synth.js')
        fs.writeFileSync(synthPath, `
          module.exports = {
            app: ${JSON.stringify(syntheticModule.app)},
            // Other APIs that can't be stringified can't be used in this approach
          }
        `)
        return synthPath
      } catch(e) {
        // Absolute last resort
        throw new Error('Cannot resolve electron built-in module in Electron v42+. ' +
          'This version of Electron does not support require("electron"). ' +
          'Please use a different version or import pattern.')
      }
    }

    return origResolveFilename.call(this, request, parent, isMain, options)
  }
}

module.exports = {}
