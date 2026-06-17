
// Electron v42 loader fix
export function resolve(specifier, context, nextResolve) {
  if (specifier === "electron") {
    return {
      url: "file:///electron-builtin.mjs",
      shortCircuit: true
    }
  }
  return nextResolve(specifier, context)
}

