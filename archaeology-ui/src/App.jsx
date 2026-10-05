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

  const handleGithubFetch = () => {
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
          <div
            style={{
              width: '450px',
              borderLeft: '1px solid #4a5568',
              display: 'flex',
              flexDirection: 'column',
              background: '#2d3748',
              flexShrink: 0,
              minHeight: 0,
            }}
          >
            {/* ---------------------------------------------
                HEADER
                --------------------------------------------- */}

            <div
              style={{
                padding: '15px',
                borderBottom: '1px solid #4a5568',
                background: '#1a202c',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedFile}
              </h2>

              <button
                onClick={() => setSelectedFile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a0aec0',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ✖
              </button>
            </div>

            {/* ---------------------------------------------
                CHANGE IMPACT ANALYSIS
                --------------------------------------------- */}
            {selectedFileImpact && (
              <div style={{ padding: '15px', borderBottom: '1px solid #4a5568', background: '#2d3748', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '13px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Blast Radius
                  </h3>
                  <span style={{ background: '#1a202c', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: selectedFileImpact.riskColor, border: `1px solid ${selectedFileImpact.riskColor}` }}>
                    {selectedFileImpact.risk} RISK
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                  <div style={{ background: '#1a202c', padding: '8px', borderRadius: '6px', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{selectedFileImpact.directCount}</div>
                    <div style={{ fontSize: '11px', color: '#a0aec0' }}>Direct</div>
                  </div>
                  <div style={{ background: '#1a202c', padding: '8px', borderRadius: '6px', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{selectedFileImpact.totalCount}</div>
                    <div style={{ fontSize: '11px', color: '#a0aec0' }}>Total Affected</div>
                  </div>
                </div>

                {selectedFileImpact.totalCount > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>Potentially affected downstream:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedFileImpact.sampleFiles.map((file, i) => (
                        <span key={i} style={{ background: '#1a202c', color: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', border: '1px solid #4a5568' }}>
                          {file}
                        </span>
                      ))}
                      {selectedFileImpact.hasMore && (
                        <span style={{ color: '#a0aec0', fontSize: '11px', alignSelf: 'center' }}>+{selectedFileImpact.totalCount - 4} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------
                CODE VIEWER
                --------------------------------------------- */}

            <div
              style={{
                flex: 1,
                padding: '15px',
                overflowY: 'auto',
                textAlign: 'left',
                borderBottom: '2px solid #1a202c',
                minHeight: 0,
              }}
            >
              <h3
                style={{
                  fontSize: '12px',
                  color: '#a0aec0',
                  marginTop: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Source Code
              </h3>

              <pre
                style={{
                  background: '#1a202c',
                  padding: '10px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  overflowX: 'auto',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <code>{fileContent}</code>
              </pre>
            </div>

            {/* ---------------------------------------------
                CHAT
                --------------------------------------------- */}

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: '#2d3748',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              {/* Chat messages */}

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minHeight: 0,
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ color: '#a0aec0', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
                    Ask a question about this file to start the conversation.
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? '#3182ce' : '#4a5568',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        maxWidth: '90%',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        textAlign: 'left',
                        overflowX: 'auto',
                      }}
                    >
                      {msg.role === 'ai' ? (
                        <ReactMarkdown 
                          components={{
                            code({node, inline, className, children, ...props}) {
                              return (
                                <code
                                  style={{
                                    background: '#1a202c',
                                    padding: inline ? '2px 4px' : '8px',
                                    borderRadius: '4px',
                                    display: inline ? 'inline' : 'block',
                                    color: '#63b3ed'
                                  }}
                                  {...props}
                                >
                                  {children}
                                </code>
                              )
                            }
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
                
                {/* The "Thinking" Bubble */}
                {isChatLoading && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: '#4a5568',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#cbd5e0',
                      fontStyle: 'italic',
                      display: 'flex',
                      gap: '5px',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>✨</span> Gemini is thinking...
                  </div>
                )}
              </div>

              {/* -----------------------------------------
                  AI CHAT INPUT
                  ----------------------------------------- */}

              <div
                style={{
                  padding: '15px',
                  background: '#1a202c',
                  flexShrink: 0,
                }}
              >
                <input
                  type="text"
                  placeholder="Ask Gemini... (Press Enter)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2d3748',
                    color: 'white',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim() !== '') {
                      const question = e.target.value.trim();

                      setMessages((prev) => [...prev, { role: 'user', content: question }]);
                      e.target.value = '';
                      e.target.disabled = true;
                      
                      setIsChatLoading(true);

                      fetch(`${API_URL}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question, fileName: selectedFile, fileCode: fileContent }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          setIsChatLoading(false);
                          setMessages((prev) => [...prev, { role: 'ai', content: data.reply || 'No response received from AI.' }]);
                          e.target.disabled = false;
                          e.target.focus();
                        })
                        .catch((error) => {
                          console.error('AI chat error:', error);
                          setIsChatLoading(false);
                          setMessages((prev) => [...prev, { role: 'ai', content: '⚠️ Error communicating with AI.' }]);
                          e.target.disabled = false;
                          e.target.focus();
                        });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ) : codebaseInsights ? (
          /* =================================================
             ARCHITECTURE INSIGHTS DASHBOARD (CLEANED UP)
             ================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid #4a5568', background: '#1a202c' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#63b3ed' }}>🧠 Architecture Insights</h2>
              <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#a0aec0' }}>
                Analyzed {codebaseInsights.totalFiles} files and {codebaseInsights.totalDependencies} dependencies.
              </p>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* CODEBASE HEALTH SCORE */}
              <div style={{ background: '#222938', borderRadius: '8px', border: '1px solid #4a5568', overflow: 'hidden' }}>
                <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }}>Codebase Health</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 'bold', color: codebaseInsights.healthColor }}>{codebaseInsights.healthScore}</span>
                      <span style={{ fontSize: '12px', color: '#a0aec0' }}>/ 100</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: codebaseInsights.healthColor, opacity: 0.9 }}>{codebaseInsights.healthGrade}</div>
                </div>
                
                <div style={{ width: '100%', height: '4px', background: '#1a202c' }}>
                  <div style={{ width: `${codebaseInsights.healthScore}%`, height: '100%', background: codebaseInsights.healthColor, transition: 'width 1s ease-in-out' }} />
                </div>

                {/* Collapsible Score Deductions */}
                {codebaseInsights.penalties.length > 0 && (
                  <details style={{ padding: '10px 20px', background: '#1a202c', borderTop: '1px solid #4a5568' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#a0aec0', outline: 'none', userSelect: 'none' }}>
                      View Score Deductions
                    </summary>
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                      {codebaseInsights.penalties.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#e2e8f0' }}>{p.reason}</span>
                          <span style={{ color: '#fc8181', fontWeight: 'bold' }}>-{p.minus}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* AI ARCHITECTURE SUMMARY */}
              <div style={{ background: '#1a202c', padding: '15px', borderRadius: '8px', border: '1px solid #4a5568' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#63b3ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  AI System Overview
                  {!architectureSummary && !isSummaryLoading && (
                    <button onClick={fetchArchitectureSummary} style={{ padding: '4px 10px', fontSize: '12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✨ Generate</button>
                  )}
                </h3>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#e2e8f0' }}>
                  {isSummaryLoading ? (
                    <div style={{ fontStyle: 'italic', color: '#a0aec0' }}>Analyzing codebase architecture...</div>
                  ) : architectureSummary ? (
                    <ReactMarkdown>{architectureSummary}</ReactMarkdown>
                  ) : (
                    <div style={{ color: '#a0aec0' }}>Generate an AI summary to understand the high-level architecture.</div>
                  )}
                </div>
              </div>

              {/* WARNING: CIRCULAR DEPENDENCIES */}
              {codebaseInsights.cycles.length > 0 && (
                <details open style={{ background: '#2d3748' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#f6ad55', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', outline: 'none' }}>
                    ⚠ Circular Dependencies ({codebaseInsights.cycles.length})
                  </summary>
                  <div style={{ marginTop: '10px' }}>
                    {codebaseInsights.cycles.map((cycle, i) => (
                      <div key={i} style={{ background: '#7b341e', padding: '10px', borderRadius: '4px', marginBottom: '6px', borderLeft: '3px solid #dd6b20', fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}>
                        {cycle.map((nodeId, idx) => {
                          const fileName = rawNodes.find(n => n.id === nodeId)?.data.label || nodeId;
                          return (
                            <span key={idx}>
                              {fileName}{idx < cycle.length - 1 && <span style={{ color: '#fbd38d', margin: '0 4px' }}>→</span>}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* COLLAPSIBLE TOP BOTTLENECKS */}
              <details style={{ background: '#2d3748' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', outline: 'none' }}>
                  🔥 Top Bottlenecks
                </summary>
                <div style={{ marginTop: '10px' }}>
                  {codebaseInsights.topBottlenecks.map((node) => (
                    <div key={node.id} style={{ background: '#1a202c', padding: '10px', borderRadius: '4px', marginBottom: '6px', borderLeft: '3px solid #fc8181' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', wordBreak: 'break-all' }}>{node.label}</div>
                      <div style={{ fontSize: '11px', color: '#fc8181', marginTop: '2px' }}>Imported by {node.inDegree} files</div>
                    </div>
                  ))}
                </div>
              </details>

              {/* COLLAPSIBLE ENTRY POINTS */}
              <details style={{ background: '#2d3748', marginBottom: '20px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', outline: 'none' }}>
                  🚪 Likely Entry Points
                </summary>
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {codebaseInsights.entryPoints.slice(0, 10).map((node) => (
                    <span key={node.id} style={{ background: '#1a202c', color: '#68d391', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #276749' }}>
                      {node.label}
                    </span>
                  ))}
                </div>
              </details>

            </div>

            {/* STICKY LAUNCH BUTTON AT BOTTOM OF INSIGHTS */}
              <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #4a5568' }}>
                <button
                  onClick={() => setIsGlobalChatOpen(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)',
                    color: 'white',
                    border: '1px solid #63b3ed',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <span>🧠</span> Ask Repository Copilot
                </button>
              </div>

          </div>
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
    </div>
  );
}