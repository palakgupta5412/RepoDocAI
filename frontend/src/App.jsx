import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [mode, setMode] = useState('readme');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [recentRepos, setRecentRepos] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('repoDoc_recent');
    if (saved) {
      try { setRecentRepos(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveToHistory = (url, repoName) => {
    if (!url) return;
    const newItem = { url, name: repoName, timestamp: new Date().toLocaleDateString() };
    const filtered = recentRepos.filter(r => r.url !== url);
    const updated = [newItem, ...filtered].slice(0, 5);
    setRecentRepos(updated);
    localStorage.setItem('repoDoc_recent', JSON.stringify(updated));
  };

  const fetchDocs = async (selectedMode, customFeedback = '', targetUrl = repoUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://repodoc-backend.onrender.com/api/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: targetUrl, mode: selectedMode, user_feedback: customFeedback }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Failed to process repository.');

      setData(result);
      saveToHistory(targetUrl, result.repo_name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    fetchDocs(mode, '', repoUrl);
  };

  const handleTabChange = (newMode) => {
    setMode(newMode);
    if (data && repoUrl) fetchDocs(newMode, '', repoUrl);
  };

  const handleCopy = () => {
    if (!data?.generated_content) return;
    navigator.clipboard.writeText(data.generated_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!data?.generated_content) return;

    if (mode === 'readme') {
      const blob = new Blob([data.generated_content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${data.repo_name}_README.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const doc = new jsPDF();
      const title = mode === 'user_manual' ? 'User Manual & Setup Guide' : 'Production Audit Roadmap';
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`${title} - ${data.repo_name}`, 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      let cleanText = data.generated_content
        .replace(/#{1,6}\s?/g, "")
        .replace(/\*\*/g, "")
        .replace(/```/g, "")
        .replace(/[^\x00-\x7F]/g, "");

      const splitText = doc.splitTextToSize(cleanText, 180);
      let cursorY = 30;
      const pageHeight = doc.internal.pageSize.height; 

      for (let i = 0; i < splitText.length; i++) {
        if (cursorY > pageHeight - 20) {
          doc.addPage(); 
          cursorY = 20;  
        }
        doc.text(splitText[i], 15, cursorY);
        cursorY += 6; 
      }

      doc.save(`${data.repo_name}_${mode}.pdf`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      
      {/* Ambient Glow Backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-cyan-600/10 via-blue-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-40 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl ">
            <div className="h-full w-full  flex items-center justify-center">
              <img className="text-lg" src='/favicon.png'/>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              RepoDoc.AI
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Autonomous Intelligence Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-mono text-cyan-400 shadow-inner">
            ● System Online
          </span>
        </div>
      </header>

      {/* Main Container - Full Width Center Layout */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 flex flex-col gap-8 z-10">
        
        {/* Hero Section & Command Center */}
        <div className="bg-slate-950/70 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500"></div>

          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">
              Transform Any Repo Into <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">World-Class Docs</span>
            </h2>
            <p className="text-sm text-slate-400">
              Paste your GitHub link, select your desired artifact mode, and let autonomous static analysis do the heavy lifting.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto w-full">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-mono text-xs">git://</span>
              <input
                type="url"
                placeholder="[https://github.com/username/repository](https://github.com/username/repository)"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-4 py-4 text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 text-sm tracking-wide whitespace-nowrap flex items-center justify-center gap-2"
            >
              {loading ? 'Synthesizing...' : 'Initialize Analysis 🚀'}
            </button>
          </form>

          {/* Mode Selector Tabs (Horizontal & Wide) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl mx-auto w-full pt-2">
            <button
              type="button"
              onClick={() => handleTabChange('readme')}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer border flex items-center justify-between ${mode === 'readme' ? 'bg-cyan-500/10 border-cyan-500/80 shadow-lg shadow-cyan-500/10 text-cyan-300' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <div>
                <div className="font-bold text-sm">📄 GitHub README.md</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Badges, architecture & quickstart</div>
              </div>
              <span className="text-xs">→</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('user_manual')}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer border flex items-center justify-between ${mode === 'user_manual' ? 'bg-cyan-500/10 border-cyan-500/80 shadow-lg shadow-cyan-500/10 text-cyan-300' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <div>
                <div className="font-bold text-sm">🛠️ Local User Manual</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Step-by-step setup & .env guide</div>
              </div>
              <span className="text-xs">→</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('recommendations')}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer border flex items-center justify-between ${mode === 'recommendations' ? 'bg-cyan-500/10 border-cyan-500/80 shadow-lg shadow-cyan-500/10 text-cyan-300' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <div>
                <div className="font-bold text-sm">💡 Production Audit</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Milestone roadmap & security gaps</div>
              </div>
              <span className="text-xs">→</span>
            </button>
          </div>

          {/* Recent History Tags */}
          {recentRepos.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800/80 max-w-4xl mx-auto w-full">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Recent:</span>
              {recentRepos.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setRepoUrl(item.url); fetchDocs(mode, '', item.url); }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer truncate max-w-[220px]"
                >
                  📦 {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-2xl">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-100">Analyzing Repository Structure...</h3>
            <p className="text-xs font-mono text-cyan-400 mt-2">Cloning source code & querying Gemini AI engine</p>
          </div>
        )}

        {/* Full-Width Workspace Preview Area */}
        {data && !loading && (
          <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 animate-fade-in">
            
            {/* Header with Title & Action Buttons */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block mb-1">Generated Output Artifact</span>
                <h2 className="text-2xl font-black text-slate-100 capitalize flex items-center gap-3">
                  {mode === 'readme' ? '📄 GitHub README.md Preview' : mode === 'user_manual' ? '🛠️ Setup Manual Guide' : '💡 Production Audit Roadmap'}
                  <span className="text-xs font-mono font-normal px-3.5 py-1 bg-slate-900 text-cyan-300 border border-slate-800 rounded-full">
                    {data.repo_name}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleCopy}
                  className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold px-5 py-3 rounded-xl cursor-pointer border border-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {copied ? '✨ Copied to Clipboard!' : '📋 Copy Markdown'}
                </button>
                <button
                  onClick={handleDownload}
                  className={`flex-1 md:flex-none text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer shadow-xl transition-all flex items-center justify-center gap-2 ${mode === 'readme' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/20'}`}
                >
                  {mode === 'readme' ? '📥 Download .md' : '📥 Download PDF'}
                </button>
              </div>
            </div>

            {/* Wide Screen Markdown Viewer Window */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 max-h-[65vh] overflow-y-auto shadow-inner">
              <div className="prose prose-invert max-w-none text-slate-200 text-base leading-relaxed">
                <ReactMarkdown>
                  {data.generated_content}
                </ReactMarkdown>
              </div>
            </div>

            {/* AI Refinement Toolbar */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Refine documentation with AI (e.g., 'Add a Docker setup guide or explain API routes in detail')..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500 transition-all"
                />
                <button
                  onClick={() => { if(!feedback) return; fetchDocs(mode, feedback, repoUrl); setFeedback(''); }}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-8 py-4 rounded-2xl text-xs cursor-pointer transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  Update & Append ✨
                </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;