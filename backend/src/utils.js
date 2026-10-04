import path from 'path';
import fs from 'fs';

/**
 * Resolves a relative import string into an absolute file path.
 * Returns null if it's a third-party package (e.g., 'lodash').
 */
export function resolveImportPath(currentFilePath, importString) {
  // 1. Skip external npm packages and Node built-ins
  if (!importString.startsWith('.')) {
    return null; // We usually don't want to map 'node_modules' in our graph
  }

  // 2. Calculate the absolute path
  const currentDir = path.dirname(currentFilePath);
  const absolutePath = path.resolve(currentDir, importString);

  // 3. Handle missing file extensions
  // If the exact path exists (e.g., they included .js), return it
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    return absolutePath;
  }

  // Otherwise, try common JavaScript/TypeScript extensions
  const extensions = ['.js', '.ts', '/index.js', '/index.ts'];
  for (const ext of extensions) {
    const pathWithExt = `${absolutePath}${ext}`;
    if (fs.existsSync(pathWithExt)) {
      return pathWithExt;
    }
  }

  // If nothing exists, return the unresolved path (good for debugging broken imports)
  return absolutePath;
}


export function something() {
  
}