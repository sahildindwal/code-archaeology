import express from 'express';
import cors from 'cors';
import { generateGraph } from './buildGraph.js';
import fs from 'fs';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001; // React usually uses 3000 or 5173 (Vite), so we use 3001 for the backend

// 1. Middleware
// Allow requests from any frontend port during development
app.use(cors()); 
// Parse incoming JSON requests (useful for later when you send chat messages)
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Define the Graph API Endpoint
app.get('/api/graph', (req, res) => {
  try {
    // Read the requested path from the URL, default to './src'
    const targetDirectory = req.query.path || './src'; 
    console.log(`Analyzing directory: ${targetDirectory}`);
    
    // Generate the graph dynamically for the requested directory
    const graphData = generateGraph(targetDirectory);
    
    // Send it back to the React app as JSON
    res.json(graphData);
  } catch (error) {
    console.error("Error generating graph:", error);
    res.status(500).json({ error: "Failed to parse codebase. Check if the path exists." });
  }
});

// NEW: Upload and Analyze Endpoint
app.post('/api/upload', (req, res) => {
  const { files } = req.body;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files provided." });
  }

  const workspaceDir = './workspace';

  try {
    // 1. Clear out the old workspace if it exists
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }
    
    // 2. Recreate the files on the backend
    files.forEach(file => {
      const fullPath = path.join(workspaceDir, file.path);
      // Ensure the subdirectories exist before writing the file
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, file.content, 'utf8');
    });

    // 3. Generate the graph from the new workspace
    const graphData = generateGraph(workspaceDir);
    res.json(graphData);

  } catch (error) {
    console.error("Error processing upload:", error);
    res.status(500).json({ error: "Failed to process uploaded codebase." });
  }
});

// Endpoint to fetch the source code of a specific file
app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ error: "No file path provided" });
  }

  try {
    // Read the file directly from the file system
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content: content });
  } catch (error) {
    console.error("Error reading file:", error);
    res.status(500).json({ error: "Could not read the file." });
  }
});

// Updated AI Module Chat Endpoint using Gemini 3.8 Flash (with Auto-Retry)
app.post('/api/chat', async (req, res) => {
  const { question, fileName, fileCode } = req.body;

  if (!question || !fileCode) {
    return res.status(400).json({ error: "Missing question or code context." });
  }

  try {
    const prompt = `
      You are an expert software architect. The user is asking a question about a specific file in their codebase.
      
      File Name: ${fileName}
      
      Source Code:
      \`\`\`javascript
      ${fileCode}
      \`\`\`
      
      User's Question: ${question}
      
      Answer the question concisely and accurately based ONLY on the provided code.
    `;

    // Initialize the Gemini 3.8 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
    
    // Custom helper function to retry if the server is busy (503 error)
    const generateWithRetry = async (retries = 3, delay = 2000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const result = await model.generateContent(prompt);
          return result.response.text();
        } catch (error) {
          // If it's a 503 error and we haven't run out of retries, wait and try again
          if (error.status === 503 && i < retries - 1) {
            console.warn(`Google API is busy (503). Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error; // If it's a different error or we are out of retries, crash normally
          }
        }
      }
    };

    // Execute the request with our retry loop
    const replyText = await generateWithRetry();
    res.json({ reply: replyText });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Failed to generate AI response due to high server demand. Please try again later." });
  }
});

// 3. Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Code Archaeology backend running at http://localhost:${PORT}`);
  console.log(`📊 Graph endpoint: http://localhost:${PORT}/api/graph`);
});