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

const API_URL = import.meta.env.API_URL;

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

  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  const [loading, setLoading] = useState(false);

  // Chat messages
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false); // NEW: Track AI thinking state

  // Dynamic folder path
  const [targetPath, setTargetPath] = useState('./src');

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setLoading(true);
    setHoveredNodeId(null);
    setSelectedFile(null);
    setMessages([]);

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
      <div style={{ padding: '15px', background: '#2d3748', borderBottom: '1px solid #4a5568', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '18px', marginRight: '20px', color: '#63b3ed', whiteSpace: 'nowrap' }}>
          Code Archaeology
        </h1>

        <label style={{
          padding: '8px 16px', background: '#3182ce', color: 'white', 
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
        }}>
          {loading ? 'Analyzing...' : 'Select Folder to Analyze'}
          <input 
            type="file" 
            webkitdirectory="true" 
            directory="true" 
            multiple 
            onChange={handleFileUpload} 
            disabled={loading}
            style={{ display: 'none' }} // Hides the ugly default browser file input
          />
        </label>
      </div>

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
            RIGHT SIDE - CODE + CHAT SIDEBAR
            ================================================= */}

        {selectedFile && (
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
                borderBottom:
                  '1px solid #4a5568',
                background: '#1a202c',
                display: 'flex',
                justifyContent:
                  'space-between',
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
                onClick={() =>
                  setSelectedFile(null)
                }
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
                CODE VIEWER
                --------------------------------------------- */}

            <div
              style={{
                flex: 1,
                padding: '15px',
                overflowY: 'auto',
                textAlign: 'left',
                borderBottom:
                  '2px solid #1a202c',
                minHeight: 0,
              }}
            >
              <h3
                style={{
                  fontSize: '12px',
                  color: '#a0aec0',
                  marginTop: 0,
                  textTransform:
                    'uppercase',
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
                <code>
                  {fileContent}
                </code>
              </pre>
            </div>

            {/* ---------------------------------------------
                CHAT
                --------------------------------------------- */}

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection:
                  'column',
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
                  flexDirection:
                    'column',
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
                        maxWidth: '90%', // slightly wider to accommodate code blocks
                        fontSize: '14px',
                        lineHeight: '1.5',
                        textAlign: 'left',
                        // Remove whiteSpace: pre-wrap so Markdown handles the spacing
                        overflowX: 'auto', // Allows code blocks to scroll horizontally
                      }}
                    >
                      {msg.role === 'ai' ? (
                        <ReactMarkdown 
                          components={{
                            // Make code blocks inside the chat look distinct
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
                {/* NEW: The "Thinking" Bubble */}
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
                    boxSizing:
                      'border-box',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim() !== '') {
                      const question = e.target.value.trim();

                      // 1. Add user message and clear input
                      setMessages((prev) => [...prev, { role: 'user', content: question }]);
                      e.target.value = '';
                      e.target.disabled = true;
                      
                      // 2. Turn on the loading bubble!
                      setIsChatLoading(true);

                      // 3. Ask Gemini
                      fetch(`${API_URL}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question, fileName: selectedFile, fileCode: fileContent }),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          // 4. Turn off loading, add AI response
                          setIsChatLoading(false);
                          setMessages((prev) => [...prev, { role: 'ai', content: data.reply || 'No response received from AI.' }]);
                          e.target.disabled = false;
                          e.target.focus();
                        })
                        .catch((error) => {
                          console.error('AI chat error:', error);
                          // 4. Turn off loading even if it fails
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
        )}
      </div>
    </div>
  );
}