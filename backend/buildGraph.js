import fs from 'fs';
import path from 'path';
import { walkDirectory, extractDependencies } from './indexer.js';
// Make sure this path matches wherever you saved your utils.js file!
import { resolveImportPath } from './src/utils.js'; 

export function generateGraph(directory = './src') {
  console.log(`Crawling directory: ${directory}...`);
  
  const allFiles = walkDirectory(directory);
  const graph = { nodes: [], edges: [] };

  allFiles.forEach(file => {
    // 1. Force the file path to be absolute so it acts as a bulletproof ID
    const absoluteFilePath = path.resolve(file);

    // 2. Create the Node using the absolute path
    graph.nodes.push({ 
      id: absoluteFilePath, 
      label: path.basename(file),
      type: 'file'
    });
    
    // 3. Extract dependencies
    const { dependencies } = extractDependencies(absoluteFilePath);
    
    dependencies.forEach(importString => {
      // resolveImportPath will now return a matching absolute path
      const resolvedTarget = resolveImportPath(absoluteFilePath, importString);
      
      if (resolvedTarget) {
        graph.edges.push({
          id: `${absoluteFilePath}->${resolvedTarget}`,
          source: absoluteFilePath,
          target: resolvedTarget, 
          relation: 'imports'
        });
      }
    });
  });

  return graph;
}