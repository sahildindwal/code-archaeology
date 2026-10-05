import React from 'react';
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.VITE_API_URL;

export default function FileViewer({
  selectedFile,
  setSelectedFile,
  fileContent,
  selectedFileImpact,
  messages,
  setMessages,
  isChatLoading,
  setIsChatLoading
}) {
  return (
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

        <div style={{ padding: '15px', background: '#1a202c', flexShrink: 0 }}>
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
  );
}