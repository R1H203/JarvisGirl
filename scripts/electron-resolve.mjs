// Custom loader: intercept 'electron' resolution
// When import('electron') is used in ESM, we need it to resolve
// to the actual built-in module.
// 
// In Electron v42, 'electron' is NOT a built-in module.
// This hook creates a synthetic module that wraps the npm package
// and re-exports the Electron APIs.
export function resolve(specifier, context, nextResolve) {
  if (specifier === 'electron') {
    return {
      shortCircuit: true,
      url: new URL('file:///electron-builtin.mjs').href
    }
  }
  return nextResolve(specifier, context)
}
