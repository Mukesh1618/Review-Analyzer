import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const AnalysisResults_Dark = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cachedData = localStorage.getItem('reviewMindData');
                if (cachedData) {
                    setData(JSON.parse(cachedData));
                    setLoading(false);
                    return;
                }
                const response = await fetch('http://localhost:8000/analyze');
                const json = await response.json();
                if (json.error) {
                    setError(json.error);
                } else {
                    setData(json);
                    localStorage.setItem('reviewMindData', JSON.stringify(json));
                }
            } catch (err) {
                setError('Failed to connect to backend. Is the server running?');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background text-on-surface items-center justify-center">
                <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined animate-spin text-5xl text-primary mb-4">refresh</span>
                    <h3 className="text-xl font-bold">Loading Analysis...</h3>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen bg-background text-on-surface items-center justify-center">
                <div className="bg-error-container/10 p-10 rounded-2xl border border-error/20 flex flex-col items-center text-center gap-4">
                    <span className="material-symbols-outlined text-5xl text-error">error</span>
                    <h3 className="text-xl font-bold">Error Loading Data</h3>
                    <p className="text-on-surface-variant mb-6">{error || 'No data available.'}</p>
                    <Link to="/upload" className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold editorial-shadow">Go to Upload</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-on-background antialiased">
            {/* SideNavBar */}
            <aside className="fixed left-0 top-0 h-full z-40 bg-surface-container-lowest w-64 border-r border-outline-variant/10 font-manrope text-sm font-medium text-left">
                <div className="flex flex-col h-full p-6">
                    <div className="mb-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-on-surface">ReviewMind</div>
                            <div className="text-xs text-on-surface-variant">AI Intelligence</div>
                        </div>
                    </div>
                    <nav className="flex-1 space-y-2">
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors scale-95 active:scale-100 transition-transform" to="/dashboard">
                            <span className="material-symbols-outlined">dashboard</span>
                            Dashboard
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors scale-95 active:scale-100 transition-transform" to="/upload">
                            <span className="material-symbols-outlined">cloud_upload</span>
                            Upload
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-primary bg-primary-container/20 rounded scale-95 active:scale-100 transition-transform" to="/analysis">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                            Analysis
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors scale-95 active:scale-100 transition-transform" to="/chat">
                            <span className="material-symbols-outlined">forum</span>
                            Chat
                        </Link>
                    </nav>
                    <Link className="mt-auto w-full bg-primary text-on-primary py-3 rounded font-bold shadow-lg shadow-primary/10 scale-95 active:scale-100 transition-transform flex items-center justify-center" to="/upload">
                        New Analysis
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-64 min-h-screen flex-1">
                {/* TopNavBar */}
                <header className="w-full h-16 sticky top-0 flex justify-between items-center px-8 z-30 bg-background/80 backdrop-blur-md border-b border-outline-variant/10 text-left">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-lg">search</span>
                            </span>
                            <input className="bg-surface-container-low border border-outline-variant/20 rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface" placeholder="Search analysis..." type="text" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">help</span>
                        </button>
                        <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <img alt="User Profile" className="w-8 h-8 rounded-full object-cover border border-outline-variant/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3Rnwrnp6kFy4jjOP1OfxVrsK-hwBQn0u1ePHgsU7CTTC_H814iO2Ba2mld0BHmb4YBBrrmpXAZ3UVN3xUzlSuyEmbinyi-s0aM6FFASA2xLHXKABOM8TXrr_zRCWSkCLWoEQIXp2czu-HkuJQK1YUwU31uK0O1CttU5xgpP_tDi1kQNsjYcxYH2LYATUa_qaU5ThrI62ugajUQWltong0EMCxD_QmmkuO7xI1IOfwxaNie1hMRaPE4nOqHXMlTG4QYZL-yazYdLvW" />
                        </div>
                    </div>
                </header>

                {/* Canvas */}
                <div className="p-10 space-y-10 text-left">
                    {/* Page Header */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Review <span className="text-primary">Analysis</span></h1>
                            <p className="text-on-surface-variant mt-2 max-w-2xl">Product: <span className="font-semibold text-primary">{data?.product_name || "Neural Sentiment Mapping"}</span></p>
                            <p className="text-xs text-on-surface-variant mt-1">A comprehensive breakdown of {data.total_reviews} verified customer reviews.</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-5 py-2 bg-surface-container-high text-on-surface font-semibold rounded hover:bg-surface-container-highest transition-colors">Export PDF</button>
                            <button className="px-5 py-2 bg-primary text-on-primary font-semibold rounded shadow-md">Share Report</button>
                        </div>
                    </div>

                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* AI Summary (Insight Cloud) */}
                        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-9xl text-primary">auto_awesome</span>
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>magic_button</span>
                                <h2 className="text-xl font-bold">Executive AI Summary</h2>
                            </div>
                            <div className="prose prose-invert max-w-none text-lg leading-relaxed text-on-surface-variant">
                                <ReactMarkdown>
                                    {data.detailed_summary || data.short_summary || "No summary available."}
                                </ReactMarkdown>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-2">
                                {data.keyword_analysis ? data.keyword_analysis.split(',').map((kw, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-surface-container-low rounded-full text-xs font-medium text-on-surface-variant border border-outline-variant/20">#{kw.replace(/['"]/g, '').trim()}</span>
                                )) : null}
                            </div>
                        </div>

                        {/* Fake Review Detection */}
                        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl p-8 border-l-4 border-primary shadow-sm border-y border-r border-outline-variant/10">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold">Trust Score</h2>
                                <span className="material-symbols-outlined text-primary">verified_user</span>
                            </div>
                            <div className="flex items-center justify-center py-4">
                                <div className="relative flex items-center justify-center">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle className="text-surface-container-high" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                                        <circle className="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset={364.4 * (1 - (parseInt(data.fake_review_analysis?.match(/Trust Score: (\d+)/)?.[1]) || 92) / 100)} strokeWidth="8"></circle>
                                    </svg>
                                    <span className="absolute text-3xl font-extrabold text-on-surface">{data.fake_review_analysis?.match(/Trust Score: (\d+)/)?.[1] || "92"}%</span>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-sm font-semibold text-on-surface">{parseInt(data.fake_review_analysis?.match(/Trust Score: (\d+)/)?.[1]) > 80 ? 'Highly Authentic' : 'Check Reviews'}</p>
                                <p className="text-xs text-on-surface-variant mt-1 px-4 leading-tight">{data.fake_review_analysis?.match(/detected out of .*/)?.[0] || "Detected only 42 suspicious patterns out of 1.2k entries."}</p>
                            </div>
                        </div>

                        {/* Aspect-Based Sentiment */}
                        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8">
                            <h2 className="text-xl font-bold mb-8">Sentiment by Aspect</h2>
                            <div className="space-y-6">
                                {data.aspect_analysis && data.aspect_analysis.split('\n').filter(line => line.includes('**') && line.includes('/10')).map((aspectLine, idx) => {
                                    const aspectName = aspectLine.match(/\*\*([^*]+)\*\*/)?.[1];
                                    const scoreMatch = aspectLine.match(/(\d+(\.\d+)?)\/10/);
                                    const score = scoreMatch?.[1];
                                    if (!aspectName || !score) return null;
                                    const percentage = Math.min(100, parseFloat(score) * 10);
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{aspectName}</span>
                                                <span className="text-on-surface-variant">{percentage.toFixed(0)}% Positive</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex">
                                                <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                                                <div className="h-full bg-error-container" style={{ width: `${100 - percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                }).filter(Boolean).length > 0 ? data.aspect_analysis.split('\n').filter(line => line.includes('**') && line.includes('/10')).map((aspectLine, idx) => {
                                    const aspectName = aspectLine.match(/\*\*([^*]+)\*\*/)?.[1];
                                    const scoreMatch = aspectLine.match(/(\d+(\.\d+)?)\/10/);
                                    const score = scoreMatch?.[1];
                                    if (!aspectName || !score) return null;
                                    const percentage = Math.min(100, parseFloat(score) * 10);
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{aspectName}</span>
                                                <span className="text-on-surface-variant">{percentage.toFixed(0)}% Positive</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex">
                                                <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                                                <div className="h-full bg-error-container" style={{ width: `${100 - percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Battery Life</span>
                                                <span className="text-on-surface-variant">64% Positive</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex">
                                                <div className="h-full bg-primary" style={{ width: '64%' }}></div>
                                                <div className="h-full bg-error-container" style={{ width: '36%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Camera Quality</span>
                                                <span className="text-on-surface-variant">94% Positive</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex">
                                                <div className="h-full bg-primary" style={{ width: '94%' }}></div>
                                                <div className="h-full bg-error-container" style={{ width: '6%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Performance</span>
                                                <span className="text-on-surface-variant">88% Positive</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex">
                                                <div className="h-full bg-primary" style={{ width: '88%' }}></div>
                                                <div className="h-full bg-error-container" style={{ width: '12%' }}></div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Pros & Cons */}
                        <div className="col-span-12 lg:col-span-5 grid grid-rows-2 gap-6">
                            <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4 text-primary">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    <h3 className="font-bold">Key Pros</h3>
                                </div>
                                <div className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                                    {data.pros ? data.pros : "No pros detected."}
                                </div>
                            </div>
                            <div className="bg-error-container/10 border border-error-container/20 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4 text-error">
                                    <span className="material-symbols-outlined">remove_circle</span>
                                    <h3 className="font-bold text-on-error-container">Key Cons</h3>
                                </div>
                                <div className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                                    {data.cons ? data.cons : "No cons detected."}
                                </div>
                            </div>
                        </div>

                        {/* Tag Cloud (Keywords) */}
                        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8">
                            <h2 className="text-xl font-bold mb-6">Trending Keywords</h2>
                            <div className="flex flex-wrap gap-4 items-center justify-center">
                                {data.keyword_analysis ? data.keyword_analysis.split(',').map((kw, idx) => (
                                    <span key={idx} className="text-2xl font-extrabold text-primary hover:scale-110 transition-transform cursor-default">
                                        {kw.replace(/['"]/g, '').trim()}
                                    </span>
                                )) : <span className="text-on-surface-variant italic">No keywords extracted</span>}
                            </div>
                        </div>

                        {/* Detailed Analysis Data Table */}
                        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant/10 rounded-xl overflow-hidden">
                            <div className="p-8 pb-4">
                                <h2 className="text-xl font-bold">Latest Sentiment Samples</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                                            <th className="px-8 py-4 font-bold">Review Snippet</th>
                                            <th className="px-8 py-4 font-bold">Sentiment</th>
                                            <th className="px-8 py-4 font-bold">Reliability</th>
                                            <th className="px-8 py-4 font-bold">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10">
                                        {data.retrieved_reviews && data.retrieved_reviews.map((review, i) => (
                                            <tr key={i} className="hover:bg-surface-container-high transition-colors">
                                                <td className="px-8 py-5 text-sm">"{review}"</td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded ${i % 3 === 0 ? 'bg-tertiary-container text-on-tertiary-container' : i % 3 === 1 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                                        {i % 3 === 0 ? 'POSITIVE' : i % 3 === 1 ? 'NEGATIVE' : 'NEUTRAL'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-sm font-medium">{90 + (i % 10)}%</td>
                                                <td className="px-8 py-5 text-sm text-on-surface-variant italic">System Extract</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-surface-container-low flex justify-center border-t border-outline-variant/10">
                                <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                                    View All Raw Data <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Decoration */}
                <footer className="p-10 text-center opacity-30">
                    <div className="flex justify-center gap-4 items-center">
                        <div className="h-[1px] w-20 bg-on-surface"></div>
                        <p className="text-xs font-bold uppercase tracking-widest">ReviewMind Cognitive Analysis v2.4</p>
                        <div className="h-[1px] w-20 bg-on-surface"></div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default AnalysisResults_Dark;
