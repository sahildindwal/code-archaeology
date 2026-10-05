import React, { useState, useEffect } from 'react';

export default function TopNavbar({ 
  loading, 
  onLocalUpload, 
  onGithubAnalyze, 
  isSidebarOpen, 
  setIsSidebarOpen 
}) {
  const [githubUrl, setGithubUrl] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);

  // Auto-fetch branches when a valid GitHub URL is pasted
  useEffect(() => {
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const owner = match[1];
      const repo = match[2].replace('.git', '');
      
      setIsFetchingBranches(true);
      fetch(`https://api.github.com/repos/${owner}/${repo}/branches`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setBranches(data.map(b => b.name));
            // Default to main or master if available
            const defaultBranch = data.find(b => b.name === 'main' || b.name === 'master')?.name || data[0].name;
            setSelectedBranch(defaultBranch);
          } else {
            setBranches([]);
          }
          setIsFetchingBranches(false);
        })
        .catch(() => {
          setBranches([]);
          setIsFetchingBranches(false);
        });
    } else {
      setBranches([]);
      setSelectedBranch('');
    }
  }, [githubUrl]);

  return (
    <div style={{ padding: '15px', background: '#2d3748', borderBottom: '1px solid #4a5568', display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
      <h1 style={{ margin: 0, fontSize: '18px', marginRight: '10px', color: '#63b3ed', whiteSpace: 'nowrap' }}>
        Code Archaeology
      </h1>

      {/* GitHub Import UI */}
      <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '650px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Paste GitHub URL (e.g., https://github.com/user/repo)"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          disabled={loading}
          style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #4a5568', background: '#1a202c', color: 'white', outline: 'none' }}
        />
        
        {isFetchingBranches ? (
          <span style={{ fontSize: '12px', color: '#a0aec0' }}>Loading branches...</span>
        ) : branches.length > 0 ? (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            disabled={loading}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', background: '#1a202c', color: 'white', outline: 'none', maxWidth: '150px' }}
          >
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        ) : null}

        <button
          onClick={() => onGithubAnalyze(githubUrl, selectedBranch)}
          disabled={loading || !githubUrl}
          style={{ padding: '8px 16px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '4px', cursor: (loading || !githubUrl) ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: (loading || !githubUrl) ? 0.6 : 1 }}
        >
          Analyze
        </button>
      </div>

      <div style={{ color: '#a0aec0', fontSize: '14px', fontWeight: 'bold' }}>OR</div>

      {/* Local Folder Upload UI */}
      <label style={{
        padding: '8px 16px', background: '#3182ce', color: 'white', 
        border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: loading ? 0.6 : 1
      }}>
        {loading ? 'Analyzing...' : 'Upload Folder'}
        <input 
          type="file" 
          webkitdirectory="true" 
          directory="true" 
          multiple 
          onChange={onLocalUpload} 
          disabled={loading}
          style={{ display: 'none' }} 
        />
      </label>

      {/* Sidebar Toggle Button */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          style={{ padding: '8px 12px', background: isSidebarOpen ? '#4a5568' : '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isSidebarOpen ? 'Collapse ➡' : '⬅ Expand'}
        </button>
      </div>
    </div>
  );
}