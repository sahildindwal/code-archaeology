import React, { useState, useEffect } from 'react';

export default function TopNavbar({ 
  loading, 
  onLocalUpload, 
  onGithubAnalyze, 
  isSidebarOpen, 
  setIsSidebarOpen 
}) {
  const [githubUrl, setGithubUrl] = useState('');
  const [options, setOptions] = useState([]);
  const [selectedRef, setSelectedRef] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // Auto-fetch branches AND commits when a valid GitHub URL is pasted
  useEffect(() => {
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const owner = match[1];
      const repo = match[2].replace('.git', '');
      
      setIsFetching(true);
      
      Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}/branches`).then(r => r.ok ? r.json() : []),
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits`).then(r => r.ok ? r.json() : [])
      ])
      .then(([branches, commits]) => {
        const combinedOptions = [];
        
        if (Array.isArray(branches)) {
          branches.forEach(b => combinedOptions.push({ label: `🌿 Branch: ${b.name}`, value: b.name }));
        }
        
        if (Array.isArray(commits)) {
          // Grab the 15 most recent commits
          commits.slice(0, 15).forEach(c => {
            const shortSha = c.sha.substring(0, 7);
            const msg = c.commit.message.split('\n')[0].substring(0, 30);
            combinedOptions.push({ label: `📝 Commit: ${shortSha} - ${msg}...`, value: c.sha });
          });
        }
        
        setOptions(combinedOptions);
        if (combinedOptions.length > 0) {
          // Default to main/master if exists, otherwise first option
          const defaultBranch = combinedOptions.find(o => o.value === 'main' || o.value === 'master');
          setSelectedRef(defaultBranch ? defaultBranch.value : combinedOptions[0].value);
        }
        setIsFetching(false);
      })
      .catch(() => {
        setOptions([]);
        setIsFetching(false);
      });
    } else {
      setOptions([]);
      setSelectedRef('');
    }
  }, [githubUrl]);

  return (
    <div style={{ padding: '15px', background: '#2d3748', borderBottom: '1px solid #4a5568', display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
      <h1 style={{ margin: 0, fontSize: '18px', marginRight: '10px', color: '#63b3ed', whiteSpace: 'nowrap' }}>
        Code Archaeology
      </h1>

      {/* GitHub Import UI */}
      <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '750px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Paste GitHub URL (e.g., https://github.com/user/repo)"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          disabled={loading}
          style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #4a5568', background: '#1a202c', color: 'white', outline: 'none' }}
        />
        
        {isFetching ? (
          <span style={{ fontSize: '12px', color: '#a0aec0', whiteSpace: 'nowrap' }}>Loading history...</span>
        ) : options.length > 0 ? (
          <select
            value={selectedRef}
            onChange={(e) => setSelectedRef(e.target.value)}
            disabled={loading}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', background: '#1a202c', color: 'white', outline: 'none', maxWidth: '300px' }}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : null}

        <button
          onClick={() => onGithubAnalyze(githubUrl, selectedRef)}
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
        border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap'
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
          style={{ padding: '8px 12px', background: isSidebarOpen ? '#4a5568' : '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
        >
          {isSidebarOpen ? 'Collapse ➡' : '⬅ Expand'}
        </button>
      </div>
    </div>
  );
}