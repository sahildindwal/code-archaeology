import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import ReactMarkdown from 'react-markdown';
import TopNavbar from './components/TopNavbar.jsx';
import ArchitectureInsights from './components/ArchitectureInsights';
import FileViewer from './components/FileViewer';

const API_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------
// DAGRE LAYOUT
// ---------------------------------------------------------

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 100,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: 160,
      height: 60,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 80,
        y: nodeWithPosition.y - 30,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
};

// ---------------------------------------------------------
// APP
// ---------------------------------------------------------

export default function App() {
  const [rawNodes, setRawNodes] = useState([]);
  const [rawEdges, setRawEdges] = useState([]);
  // Architecture Diffing State
  const [snapshot, setSnapshot] = useState(null);
  const [showDiffModal, setShowDiffModal] = useState(false);
  // Global Chat State
  const [globalMessages, setGlobalMessages] = useState([]);
  const [isGlobalChatLoading, setIsGlobalChatLoading] = useState(false);

  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Architecture Summary State
  const [architectureSummary, setArchitectureSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  const [loading, setLoading] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Chat messages
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false); // NEW: Track AI thinking state

  // Dynamic folder path
  const [targetPath, setTargetPath] = useState('./src');

  // Global Chat Modal & Dragging State
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [chatPosition, setChatPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 470 : 800, 
    y: typeof window !== 'undefined' ? window.innerHeight - 560 : 200 
  });

  const handleDragStart = (e) => {
    // Prevent dragging when clicking buttons inside the header
    if (e.target.closest('button')) return;

    const startX = e.clientX - chatPosition.x;
    const startY = e.clientY - chatPosition.y;

    const onMouseMove = (moveEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - 440, moveEvent.clientX - startX));
      const newY = Math.max(10, Math.min(window.innerHeight - 520, moveEvent.clientY - startY));
      setChatPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setLoading(true);
    setHoveredNodeId(null);
    setSelectedFile(null);
    setMessages([]);
    setGlobalMessages([]);

    const fileDataArray = [];

    // Filter and read files locally in the browser
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath;

      // 1. Skip heavy/irrelevant folders to prevent crashing
      if (relPath.includes('node_modules') || relPath.includes('.git') || relPath.includes('dist') || relPath.includes('build')) {
        continue;
      }

      // 2. Only read JavaScript/TypeScript files
      if (!relPath.match(/\.(js|jsx|ts|tsx)$/)) {
        continue;
      }

      // 3. Extract the text
      const text = await file.text();
      fileDataArray.push({ path: relPath, content: text });
    }

    if (fileDataArray.length === 0) {
      alert("No valid JavaScript/TypeScript files found in this folder.");
      setLoading(false);
      return;
    }

    // Send the filtered codebase to the backend workspace
    fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: fileDataArray })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          setLoading(false);
          return;
        }

        const formattedNodes = data.nodes.map((node) => ({
          id: node.id,
          data: { label: node.label },
          position: { x: 0, y: 0 },
        }));

        const formattedEdges = data.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep', // Keeps lines neat
          animated: true,
        }));

        const layouted = getLayoutedElements(formattedNodes, formattedEdges);
        setRawNodes(layouted.nodes);
        setRawEdges(layouted.edges);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to upload and analyze directory.");
        setLoading(false);
      });
  };

 const handleGithubFetch = (url, branch) => {
    if (!url || !url.trim()) return;

    setLoading(true);
    setHoveredNodeId(null);
    setSelectedFile(null);
    setMessages([]);
    setGlobalMessages([]);

    fetch(`${API_URL}/api/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl: url, branch: branch || '' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          setLoading(false);
          return;
        }

        const formattedNodes = data.nodes.map((node) => ({
          id: node.id,
          data: { label: node.label },
          position: { x: 0, y: 0 },
        }));

        const formattedEdges = data.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: true,
        }));

        const layouted = getLayoutedElements(formattedNodes, formattedEdges);
        setRawNodes(layouted.nodes);
        setRawEdges(layouted.edges);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to analyze GitHub repository. It might be too large or private.");
        setLoading(false);
      });
  };

  const fetchArchitectureSummary = () => {
    if (!codebaseInsights) return;
    
    setIsSummaryLoading(true);
    
    fetch(`${API_URL}/api/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insights: codebaseInsights }),
    })
      .then((res) => res.json())
      .then((data) => {
        setArchitectureSummary(data.summary);
        setIsSummaryLoading(false);
      })
      .catch((error) => {
        console.error('Summary error:', error);
        setArchitectureSummary('⚠️ Failed to generate summary.');
        setIsSummaryLoading(false);
      });
  };


  // ---------------------------------------------------------
  // NODE / EDGE CHANGES
  // ---------------------------------------------------------

  const onNodesChange = useCallback(
    (changes) => {
      setRawNodes((nodes) => applyNodeChanges(changes, nodes));
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setRawEdges((edges) => applyEdgeChanges(changes, edges));
    },
    []
  );

  // ---------------------------------------------------------
  // BLAST RADIUS
  // ---------------------------------------------------------

  const blastRadiusNodeIds = useMemo(() => {
    if (!hoveredNodeId) {
      return new Set();
    }

    const dependents = new Set();

    rawEdges.forEach((edge) => {
      if (edge.target === hoveredNodeId) {
        dependents.add(edge.source);
      }
    });

    return dependents;
  }, [hoveredNodeId, rawEdges]);

// ---------------------------------------------------------
  // CODEBASE ARCHITECTURE INSIGHTS & CYCLE DETECTION
  // ---------------------------------------------------------
  const codebaseInsights = useMemo(() => {
    if (!rawNodes.length || !rawEdges.length) return null;

    const metrics = {};
    const adjList = {}; // For DFS traversal

    rawNodes.forEach((n) => {
      metrics[n.id] = { id: n.id, label: n.data.label, inDegree: 0, outDegree: 0 };
      adjList[n.id] = [];
    });

    rawEdges.forEach((e) => {
      if (metrics[e.target]) metrics[e.target].inDegree += 1;
      if (metrics[e.source]) metrics[e.source].outDegree += 1;
      if (adjList[e.source]) adjList[e.source].push(e.target);
    });

    // --- NEW: DFS Cycle Detection ---
    const visited = new Set();
    const recursionStack = new Set();
    const detectedCycles = [];

    const dfs = (nodeId, path) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adjList[nodeId] || [];
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path, neighbor]);
        } else if (recursionStack.has(neighbor)) {
          // Cycle found! Extract just the loop part
          const cycleStartIdx = path.indexOf(neighbor);
          const cyclePath = path.slice(cycleStartIdx);
          cyclePath.push(neighbor); // Close the loop visually (A -> B -> A)
          
          // FIX: Spread into a new array before sorting so we don't mutate the original path!
          const cycleString = [...cyclePath].sort().join('->');
          if (!detectedCycles.some(c => [...c].sort().join('->') === cycleString)) {
            detectedCycles.push(cyclePath);
          }
        }
      }
      recursionStack.delete(nodeId);
    };

    rawNodes.forEach(n => {
      if (!visited.has(n.id)) dfs(n.id, [n.id]);
    });
    // --------------------------------

    const allNodes = Object.values(metrics);

    // --- NEW: Health Score & Penalty Tracking ---
    let healthScore = 100;
    const penalties = [];
    
    if (detectedCycles.length > 0) {
      const cyclePenalty = detectedCycles.length * 15;
      healthScore -= cyclePenalty;
      penalties.push({ reason: `Circular dependencies (${detectedCycles.length})`, minus: cyclePenalty });
    }
    
    const godModulesCount = allNodes.filter(n => n.inDegree > 10).length;
    if (godModulesCount > 0) {
      const godPenalty = godModulesCount * 5;
      healthScore -= godPenalty;
      penalties.push({ reason: `Highly coupled "God Modules" (${godModulesCount})`, minus: godPenalty });
    }
    
    const isolatedCount = allNodes.filter((n) => n.inDegree === 0 && n.outDegree === 0).length;
    if (isolatedCount > 0) {
      const isoPenalty = isolatedCount * 2;
      healthScore -= isoPenalty;
      penalties.push({ reason: `Isolated/dead files (${isolatedCount})`, minus: isoPenalty });
    }

    healthScore = Math.max(0, healthScore);
    
    let healthColor = '#48bb78';
    let healthGrade = 'A';
    if (healthScore < 80) { healthColor = '#ecc94b'; healthGrade = 'B'; }
    if (healthScore < 60) { healthColor = '#ed8936'; healthGrade = 'C'; }
    if (healthScore < 40) { healthColor = '#e53e3e'; healthGrade = 'D'; }
    // -------------------------------------
    
    return {
      totalFiles: rawNodes.length,
      totalDependencies: rawEdges.length,
      topBottlenecks: [...allNodes].sort((a, b) => b.inDegree - a.inDegree).slice(0, 5),
      entryPoints: allNodes.filter((n) => n.inDegree === 0 && n.outDegree > 0),
      isolated: allNodes.filter((n) => n.inDegree === 0 && n.outDegree === 0),
      cycles: detectedCycles, // Export the found cycles
      healthScore,    // NEW
      healthColor,    // NEW
      healthGrade,    // NEW
      penalties,      // NEW
    };
  }, [rawNodes, rawEdges]);

  // ---------------------------------------------------------
  // ARCHITECTURE DIFF ENGINE
  // ---------------------------------------------------------
  const architectureDiff = useMemo(() => {
    if (!snapshot || !codebaseInsights) return null;

    // 1. Calculate File Deltas
    const currentFileIds = new Set(rawNodes.map(n => n.id));
    const snapshotFileIds = new Set(snapshot.nodes.map(n => n.id));
    
    const addedFiles = [...currentFileIds].filter(id => !snapshotFileIds.has(id));
    const removedFiles = [...snapshotFileIds].filter(id => !currentFileIds.has(id));

    // 2. Calculate Dependency Deltas
    const dependenciesDelta = rawEdges.length - snapshot.edges.length;

    // 3. Health Score Delta
    const healthDelta = codebaseInsights.healthScore - snapshot.insights.healthScore;

    // 4. Circular Dependency Check
    const newCycles = codebaseInsights.cycles.length - snapshot.insights.cycles.length;

    return {
      addedFiles,
      removedFiles,
      dependenciesDelta,
      healthDelta,
      newCycles,
      prevHealth: snapshot.insights.healthScore,
      newHealth: codebaseInsights.healthScore
    };
  }, [snapshot, codebaseInsights, rawNodes, rawEdges]);

  // ---------------------------------------------------------
  // CHANGE IMPACT ANALYSIS (SELECTED FILE)
  // ---------------------------------------------------------
  const selectedFileImpact = useMemo(() => {
    if (!selectedFile || !rawEdges.length || !rawNodes.length) return null;

    // Find the actual ID of the selected file
    const targetNode = rawNodes.find(n => n.data.label === selectedFile || n.id === selectedFile);
    if (!targetNode) return null;

    const directDependents = new Set();
    const allDependents = new Set();
    
    // 1. Find direct dependents (Who imports me directly?)
    rawEdges.forEach(e => {
      if (e.target === targetNode.id) {
        directDependents.add(e.source);
        allDependents.add(e.source);
      }
    });

    // 2. Find indirect dependents (BFS Traversal)
    let queue = Array.from(directDependents);
    while(queue.length > 0) {
      const current = queue.shift();
      rawEdges.forEach(e => {
        if (e.target === current && !allDependents.has(e.source)) {
          allDependents.add(e.source);
          queue.push(e.source);
        }
      });
    }

    // 3. Calculate Risk Score
    let risk = 'LOW';
    let riskColor = '#48bb78'; // Green
    if (allDependents.size > 15) { risk = 'CRITICAL'; riskColor = '#e53e3e'; }
    else if (allDependents.size > 5) { risk = 'HIGH'; riskColor = '#dd6b20'; }
    else if (allDependents.size > 0) { risk = 'MEDIUM'; riskColor = '#d69e2e'; }

    // Map IDs back to readable filenames
    const affectedFiles = Array.from(allDependents).map(id => {
      const n = rawNodes.find(node => node.id === id);
      return n ? n.data.label : id;
    });

    return {
      directCount: directDependents.size,
      totalCount: allDependents.size,
      risk,
      riskColor,
      sampleFiles: affectedFiles.slice(0, 4), // Preview the first 4 affected files
      hasMore: affectedFiles.length > 4
    };
  }, [selectedFile, rawEdges, rawNodes]);

  // ---------------------------------------------------------
  // STYLE NODES
  // ---------------------------------------------------------

  const styledNodes = useMemo(() => {
    return rawNodes.map((node) => {
      const isTarget = node.id === hoveredNodeId;
      const isAffected = blastRadiusNodeIds.has(node.id);

      let borderColor = '#4a5568';
      let background = '#2d3748';
      let boxShadow = 'none';

      if (isTarget) {
        borderColor = '#63b3ed';
        background = '#2b6cb0';
        boxShadow = '0 0 12px #63b3ed';
      } else if (isAffected) {
        borderColor = '#fc8181';
        background = '#9b2c2c';
        boxShadow = '0 0 12px #fc8181';
      }

      return {
        ...node,

        style: {
          background,
          color: '#fff',
          border: `2px solid ${borderColor}`,
          borderRadius: '8px',
          padding: '10px',
          boxShadow,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        },

      };
    });
  }, [
    rawNodes,
    hoveredNodeId,
    blastRadiusNodeIds,
  ]);

  // ---------------------------------------------------------
  // STYLE EDGES
  // ---------------------------------------------------------

  const styledEdges = useMemo(() => {
    return rawEdges.map((edge) => {
      const isImpactEdge =
        edge.target === hoveredNodeId;

      return {
        ...edge,

        animated:
          isImpactEdge || edge.animated,

        style: {
          stroke: isImpactEdge
            ? '#fc8181'
            : '#718096',

          strokeWidth:
            isImpactEdge
              ? 3
              : 1.5,
        },
      };
    });
  }, [rawEdges, hoveredNodeId]);

  // ---------------------------------------------------------
  // NODE CLICK
  // ---------------------------------------------------------

  const onNodeClick = useCallback(
    (_, node) => {
      setSelectedFile(node.data.label);

      setFileContent('Loading code...');

      // Clear previous conversation
      setMessages([]);

      fetch(
        `${API_URL}/api/file?path=${encodeURIComponent(node.id)}`
      )
        .then((res) => res.json())
        .then((data) => {
          setFileContent(
            data.content || data.error || 'No content found.'
          );
        })
        .catch(() => {
          setFileContent(
            'Failed to load file content.'
          );
        });
    },
    []
  );

  // ---------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          color: 'white',
          padding: '20px',
          background: '#1a202c',
          width: '100vw',
          height: '100vh',
          boxSizing: 'border-box',
        }}
      >
        Loading Codebase Architecture...
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        background: '#1a202c',
        color: 'white',
      }}
    >

      {/* =====================================================
          TOP NAVBAR
          ===================================================== */}
      <TopNavbar 
        loading={loading}
        onLocalUpload={handleFileUpload}
        onGithubAnalyze={handleGithubFetch}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* =================================================
            LEFT SIDE - GRAPH
            ================================================= */}

        <div
          style={{
            flexGrow: 1,
            position: 'relative',
            minWidth: 0,
          }}
        >
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            fitView
            fitViewOptions={{
              padding: 0.2,
            }}
            panOnDrag={true}    // Forces click-and-drag to work
            panOnScroll={true}  // Allows trackpad/mouse-wheel sliding
          >
            <Controls />

            {/* NEW: The interactive slider map in the corner */}
            <MiniMap 
              nodeColor={(node) => (node.id === hoveredNodeId ? '#63b3ed' : '#4a5568')}
              maskColor="rgba(26, 32, 44, 0.8)"
              style={{ background: '#2d3748', border: '1px solid #4a5568', borderRadius: '8px' }}
            />

            <Background
              variant="dots"
              gap={20}
              size={1}
            />
          </ReactFlow>
        </div>

        {/* =================================================
            RIGHT SIDE - DYNAMIC SIDEBAR
            ================================================= */}

          {/* =================================================
            RIGHT SIDEBAR (SLIDING WRAPPER)
            ================================================= */}
        <div
          style={{
            width: isSidebarOpen ? '450px' : '0px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden', // Hides content while sliding
            flexShrink: 0,
            background: '#2d3748',
            borderLeft: isSidebarOpen ? '1px solid #4a5568' : 'none',
          }}
        >
          {/* Inner container locks width to 450px so text doesn't squish during animation */}
          <div style={{ width: '450px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {selectedFile ? (
              <FileViewer
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                fileContent={fileContent}
                selectedFileImpact={selectedFileImpact}
                messages={messages}
                setMessages={setMessages}
                isChatLoading={isChatLoading}
                setIsChatLoading={setIsChatLoading}
              />
            ) : codebaseInsights ? (
          <ArchitectureInsights
            codebaseInsights={codebaseInsights}
            architectureSummary={architectureSummary}
            isSummaryLoading={isSummaryLoading}
            fetchArchitectureSummary={fetchArchitectureSummary}
            snapshot={snapshot}
            setSnapshot={setSnapshot}
            setShowDiffModal={setShowDiffModal}
            setIsGlobalChatOpen={setIsGlobalChatOpen}
            rawNodes={rawNodes}
            rawEdges={rawEdges}
          />
        ) : null}

          </div>
        </div>
      </div>
      {/* =====================================================
          FLOATING DRAGGABLE REPOSITORY CHAT MODAL
          ===================================================== */}
      {isGlobalChatOpen && (
        <div
          style={{
            position: 'fixed',
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            width: '420px',
            height: '520px',
            background: '#1a202c',
            border: '1px solid #4a5568',
            borderRadius: '10px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* DRAGGABLE HEADER */}
          <div
            onMouseDown={handleDragStart}
            style={{
              padding: '12px 16px',
              background: '#2d3748',
              borderBottom: '1px solid #4a5568',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>🧠</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#63b3ed', letterSpacing: '0.5px' }}>
                Repository Copilot
              </span>
            </div>
            
            <button
              onClick={() => setIsGlobalChatOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 4px',
                lineHeight: 1,
              }}
              title="Close chat (History will be saved)"
            >
              ✖
            </button>
          </div>

          {/* CHAT MESSAGE LIST */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#171923',
            }}
          >
            {globalMessages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#a0aec0', fontSize: '13px', maxWidth: '80%' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#e2e8f0' }}>Macro Intelligence</p>
                Ask questions across all files (e.g., "Where does user authentication run?" or "Trace the primary data flow.")
              </div>
            ) : (
              globalMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? '#3182ce' : '#2d3748',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    maxWidth: '85%',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    overflowX: 'auto',
                    border: msg.role === 'ai' ? '1px solid #4a5568' : 'none',
                  }}
                >
                  {msg.role === 'ai' ? (
                    <ReactMarkdown
                      components={{
                        code({ inline, children, ...props }) {
                          return (
                            <code
                              style={{
                                background: '#1a202c',
                                padding: inline ? '2px 4px' : '8px',
                                borderRadius: '4px',
                                display: inline ? 'inline' : 'block',
                                color: '#63b3ed',
                              }}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              ))
            )}

            {isGlobalChatLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: '#2d3748',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#cbd5e0',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>✨</span> Reading codebase context...
              </div>
            )}
          </div>

          {/* INPUT BAR */}
          <div style={{ padding: '12px', background: '#2d3748', borderTop: '1px solid #4a5568' }}>
            <input
              type="text"
              placeholder="Ask about the entire codebase... (Enter)"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #4a5568',
                background: '#1a202c',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '13px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim() !== '') {
                  const question = e.target.value.trim();
                  setGlobalMessages((prev) => [...prev, { role: 'user', content: question }]);
                  e.target.value = '';
                  e.target.disabled = true;
                  setIsGlobalChatLoading(true);

                  fetch(`${API_URL}/api/chat/global`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      setIsGlobalChatLoading(false);
                      setGlobalMessages((prev) => [...prev, { role: 'ai', content: data.reply || 'No response.' }]);
                      e.target.disabled = false;
                      e.target.focus();
                    })
                    .catch((error) => {
                      console.error('Global chat error:', error);
                      setIsGlobalChatLoading(false);
                      setGlobalMessages((prev) => [...prev, { role: 'ai', content: '⚠️ Error communicating with AI.' }]);
                      e.target.disabled = false;
                      e.target.focus();
                    });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* =====================================================
          ARCHITECTURE DIFF MODAL
          ===================================================== */}
      {showDiffModal && architectureDiff && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '500px', background: '#1a202c', borderRadius: '10px', border: '1px solid #4a5568', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            <div style={{ padding: '15px 20px', background: '#2d3748', borderBottom: '1px solid #4a5568', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#63b3ed' }}>⚖️ Architecture Comparison</h2>
              <button onClick={() => setShowDiffModal(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '16px' }}>✖</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Health Score Delta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2d3748', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }}>Health Shift</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#a0aec0' }}>{architectureDiff.prevHealth}</span>
                  <span style={{ color: '#4a5568' }}>➡</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: architectureDiff.healthDelta >= 0 ? '#48bb78' : '#fc8181' }}>{architectureDiff.newHealth}</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: architectureDiff.healthDelta >= 0 ? '#48bb78' : '#fc8181' }}>
                    ({architectureDiff.healthDelta > 0 ? '+' : ''}{architectureDiff.healthDelta})
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: '#2d3748', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#63b3ed' }}>
                    +{architectureDiff.addedFiles.length} / -{architectureDiff.removedFiles.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '5px' }}>Files Changed</div>
                </div>
                
                <div style={{ background: '#2d3748', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: architectureDiff.dependenciesDelta > 0 ? '#fc8181' : '#48bb78' }}>
                    {architectureDiff.dependenciesDelta > 0 ? '+' : ''}{architectureDiff.dependenciesDelta}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '5px' }}>Dependencies</div>
                </div>
              </div>

              {/* Warnings */}
              {architectureDiff.newCycles > 0 && (
                <div style={{ background: '#7b341e', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #dd6b20', color: '#fff', fontSize: '13px' }}>
                  <strong>⚠ Warning:</strong> This version introduced {architectureDiff.newCycles} new circular dependenc{architectureDiff.newCycles === 1 ? 'y' : 'ies'}.
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}