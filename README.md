# 🏛️ Code Archaeology

> **Visualize, analyze, and interrogate your codebase architecture in real-time.**

Navigating massive, undocumented legacy codebases or evaluating complex hackathon repositories is overwhelming. **Code Archaeology** is a full-stack developer tool that transforms raw source code into an interactive, AI-assisted directed graph. It allows engineers to instantly see how files are connected, measure the "blast radius" of potential changes, and chat with an AI Copilot that understands the macro-architecture of the entire system.

---

## ✨ Core Features

* **🗺️ Interactive Dependency Graph:** Upload a local folder or paste a GitHub repository URL. The backend parses the Abstract Syntax Tree (AST) to map imports and exports, rendering a clean, interactive node-based architecture map.
* **💥 Blast Radius Analysis:** Click any file to see exactly how many downstream modules rely on it. It calculates the risk level (Low/Medium/High/Critical) of modifying that file using Breadth-First Search (BFS) traversal.
* **🏥 Codebase Health Scoring:** Automatically runs diagnostics on your architecture, deducting points for structural flaws:
* **Circular Dependencies:** Detected via Depth-First Search (DFS) recursion stacks.
* **"God Modules":** Files with dangerously high in-degrees (highly coupled).
* **Isolated/Dead Code:** Files with zero incoming or outgoing dependencies.


* **⚖️ Architecture Diffing Engine:** Save a snapshot of a branch or commit, then load a new one to instantly compare the delta. The engine highlights newly added files, dependency bloat, and newly introduced circular loops.
* **🧠 Repository Copilot (Gemini AI):**
* **Global Chat:** A draggable, persistent floating modal to ask high-level architectural questions (e.g., *"Trace the primary data flow for user authentication"*).
* **Single-File Chat:** Click a specific node to view its source code and chat directly with Gemini about that specific file's logic.



---

## 🛠️ Tech Stack

**Frontend**

* **React + Vite:** Lightning-fast, modular UI architecture.
* **React Flow & Dagre:** Physics engine and spatial layout algorithms for rendering the dependency graph.
* **React Markdown:** For rendering rich AI responses and code blocks.

**Backend**

* **Node.js & Express:** Handles asynchronous I/O, file system traversal, and GitHub repository cloning/checkouts.
* **Tree-sitter:** High-performance, robust AST parser used to extract dependencies resiliently (ignoring commented-out code and handling varied import syntax).
* **Google Gemini API:** Powers the AI Copilot for deep code analysis and architectural summarization.

---

## ⚙️ How It Works (Under the Hood)

1. **Ingestion:** The user provides a public GitHub URL (and selects a specific branch/commit via the GitHub REST API) or uploads a local directory.
2. **AST Parsing:** The Node.js backend filters out irrelevant directories (`node_modules`, `dist`) and uses Tree-sitter to build an Abstract Syntax Tree of the target source files.
3. **Graph Construction:** Import statements are extracted and resolved to absolute paths. The system constructs a mathematical directed graph where files are nodes and imports are edges.
4. **Algorithmic Analysis:**
* In-degrees and out-degrees are calculated for bottleneck detection.
* A DFS cycle-detection algorithm flags circular dependencies.


5. **Visualization:** The raw graph data is sent to the React frontend, where `dagre` calculates spatial positioning and `React Flow` renders the interactive UI.

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v16 or higher)
* Git installed locally
* A Google Gemini API Key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/code-archaeology.git
cd code-archaeology

```

### 2. Backend Setup

```bash
cd backend
npm install

```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here

```

Start the server:

```bash
npm run start

```

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install

```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000

```

Start the React development server:

```bash
npm run dev

```

---

## 💡 Usage Workflows

* **The Pull Request Check:** Paste the GitHub URL of a repository. Use the top navbar dropdown to select the `main` branch. Click **Save Snapshot** in the right sidebar. Then, use the dropdown to select a feature branch and click **Analyze**. Click **Compare** to see if the new feature damaged the architecture.
* **The Refactor Plan:** Upload a messy local project folder. Look for red nodes (high Blast Radius) and files listed under "Circular Dependencies." Click the highest-risk file and ask the AI Copilot, *"How can I decouple this file using the Dependency Inversion Principle?"*
