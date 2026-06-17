// Electron v42 compatibility shim for ESM imports
// Import this with: --import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("./scripts/electron-shim.mjs", pathToFileURL("./"));'

import { register } from 'node:module'

register('data:text/javascript,' + encodeURIComponent(`
// This module provides the 'electron' built-in module for Electron v42+
// It intercepts import('electron') and returns the actual Electron API

const Module = require('module')
const path = require('path')
const fs = require('fs')

// Create a virtual electron module
const electronSource = \`
const { app, BrowserWindow, ipcMain, screen, nativeImage, Tray, Menu, shell, dialog, clipboard, Notification, net, session, globalShortcut, systemPreferences, TouchBar, powerMonitor, powerSaveBlocker, safeStorage, webContents, webFrameMain, desktopCapturer, autoUpdater, contentTracing, contextBridge, crashReporter, ipcRenderer, protocol, webFrame } = (() => {
  // Try to access electron through various means
  let mod

  // Method 1: Try the built-in module using Module._resolveFilename trick
  try {
    const origResolve = Module._resolveFilename
    // Create a temporary require from a path without node_modules
    const req = Module.createRequire(process.cwd() + '/__electron_shim__')
    // If this succeeds, we get the built-in module
    mod = req('electron')
  } catch(e) {}

  if (mod && typeof mod === 'object' && mod.app) {
    return mod
  }

  // Method 2: Return stub implementation
  return {
    app: {
      isPackaged: false,
      whenReady: () => Promise.resolve(),
      quit: () => process.exit(0),
      getPath: (name) => process.cwd(),
      setAppUserModelId: () => {},
      on: () => {},
      getLoginItemSettings: () => ({ openAtLogin: false }),
      setLoginItemSettings: () => {},
      focus: () => {},
      show: () => {},
      hide: () => {},
      exit: () => process.exit(0),
      requestSingleInstanceLock: () => true,
    },
    BrowserWindow: null,
    ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
    screen: null,
    nativeImage: { createFromPath: () => ({ resize: () => ({}) }), createFromBuffer: () => ({}) },
    Tray: null,
    Menu: null,
    shell: { openExternal: () => {} },
    dialog: null,
    clipboard: null,
    Notification: null,
    net: null,
    session: null,
    globalShortcut: null,
    systemPreferences: null,
  }
})()
\`

// Make these available as module exports
module.exports = {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  nativeImage,
  Tray,
  Menu,
  shell,
  dialog,
  clipboard,
  Notification,
  net,
  session,
  globalShortcut,
  systemPreferences,
  powerMonitor,
  powerSaveBlocker,
  safeStorage,
  webContents,
  webFrameMain,
  desktopCapturer,
  contentTracing,
  contextBridge,
  crashReporter,
  ipcRenderer,
  protocol,
  webFrame,
}
\`, { data: { } }))
