import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import fs from 'fs';
import path from 'path';

// 1. Initialize the Parser
const parser = new Parser();
parser.setLanguage(JavaScript);

// 2. Define a structural query to find imports
const importQuery = new Parser.Query(JavaScript, `
  (import_statement source: (string) @source)
`);

export function extractDependencies(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  
  // Parse the code into an AST
  const tree = parser.parse(code);
  
  // Execute the query against the AST
  const matches = importQuery.matches(tree.rootNode);
  
  const dependencies = matches.map(match => {
    const rawString = match.captures[0].node.text; 
    return rawString.replace(/['"]/g, ''); // strip quotes
  });

  return {
    file: filePath,
    dependencies
  };
}

export function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walkDirectory(fullPath, fileList);
      }
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  });
  
  return fileList;
}

// Quick local test: run `node indexer.js`
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log("Testing extractDependencies:");
  // Ensure you create a dummy 'example.js' file in the same directory first
  // const result = extractDependencies('./example.js');
  // console.log(JSON.stringify(result, null, 2));
}