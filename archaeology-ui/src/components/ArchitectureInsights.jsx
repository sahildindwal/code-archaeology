import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ArchitectureInsights({
  codebaseInsights,
  architectureSummary,
  isSummaryLoading,
  fetchArchitectureSummary,
  snapshot,
  setSnapshot,
  setShowDiffModal,
  setIsGlobalChatOpen,
  rawNodes,
  rawEdges
}) {
  if (!codebaseInsights) return null;

  return (
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

        {/* TOP BOTTLENECKS */}
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

        {/* ENTRY POINTS */}
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

      {/* DIFF & SNAPSHOT CONTROLS */}
      <div style={{ padding: '15px', borderTop: '1px solid #4a5568', background: '#1a202c', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            setSnapshot({ nodes: rawNodes, edges: rawEdges, insights: codebaseInsights });
            alert("Architecture Snapshot Saved! Now upload a newer version of the codebase to compare.");
          }}
          style={{ flex: 1, padding: '8px', background: '#2d3748', color: '#cbd5e0', border: '1px solid #4a5568', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
        >
          📸 Save Snapshot
        </button>
        
        {snapshot && (
          <button
            onClick={() => setShowDiffModal(true)}
            style={{ flex: 1, padding: '8px', background: '#d69e2e', color: '#1a202c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            ⚖️ Compare
          </button>
        )}
      </div>

      {/* STICKY LAUNCH BUTTON AT BOTTOM */}
      <div style={{ padding: '15px', background: '#2d3748', borderTop: '1px solid #4a5568' }}>
        <button
          onClick={() => setIsGlobalChatOpen(true)}
          style={{ width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)', color: 'white', border: '1px solid #63b3ed', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }}
        >
          <span>🧠</span> Ask Repository Copilot
        </button>
      </div>
    </div>
  );
}