# 🏛️ Code Archaeology

An interactive, AI-powered codebase visualization and analysis tool. 

Code Archaeology allows developers to upload local projects and instantly map out their file dependencies in a hierarchical, interactive graph. It features an integrated AI assistant powered by Gemini 3.8 Flash, allowing users to ask context-aware questions about specific files directly from the UI.

## ✨ Key Features

* **Dynamic Codebase Mapping:** Select any local folder and the application instantly parses JavaScript/TypeScript imports to build an architectural map.
* **Smart Local Filtering:** Client-side processing automatically ignores heavy/irrelevant folders (`node_modules`, `.git`, `dist`) before uploading, preventing browser crashes and saving bandwidth.
* **Blast Radius Analysis:** Hover over any module in the graph to instantly visualize its blast radius—highlighting all direct dependents and dependencies in real-time.
* **Auto-Layout Engine:** Utilizes Dagre graph algorithms to untangle spaghetti code, routing connections cleanly using `smoothstep` edges and a top-down hierarchy.
* **Context-Aware AI Chat:** Integrated sidebar featuring a Markdown-supported chat interface. Click any file to view its source code and converse with Gemini about its logic.
* **Resilient Architecture:** The Node.js backend includes custom auto-retry mechanisms to gracefully handle API rate limits and 503 Server Unavailable errors without crashing the client.

## 🛠️ Tech Stack

**Frontend**
* React (Vite)
* React Flow (Graph rendering, Minimap, Pan/Zoom)
* Dagre (Directed graph auto-layout)
* React-Markdown (Chat formatting)

**Backend**
* Node.js & Express
* File System (`fs`) & Path modules for dynamic workspace generation
* Google Generative AI SDK (`gemini-3.8-flash`)

## 🚀 Getting Started

### Prerequisites
* Node.js installed on your machine
* A free Gemini API key from [Google AI Studio](https://aistudio.google.com/)

## 1. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend



### 1.Install dependencies:

Bash
npm install

### 2.Create a .env file in the root of the backend folder and add your API key:
Code snippet
GEMINI_API_KEY=your_actual_api_key_here

### 3.Start the Express server:
Bash
node server.js

## Frontend Setup
Open a new terminal and navigate to the frontend folder:

Bash
cd frontend
Install dependencies:

Bash
npm install
Start the Vite development server:

Bash
npm run dev

# 💡 How to Use
Open the application in your browser.

Click "Select Folder to Analyze" in the top navigation bar.

Choose any local React, Node, or standard JavaScript project folder from your machine.

Use your mouse to pan around the graph, or use the Minimap in the bottom left to navigate large codebases.

Hover over any file node to see what other files rely on it.

Click on a node to open it in the sidebar. You can view the raw source code on the top half, and ask the AI assistant questions about the code in the bottom half.
