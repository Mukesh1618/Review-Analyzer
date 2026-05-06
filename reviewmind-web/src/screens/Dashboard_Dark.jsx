import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard_Dark = () => {
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

    return (
        <div className="bg-background text-on-surface min-h-screen">
            {/* SideNavBar Shell */}
            <aside className="fixed left-0 top-0 h-full z-40 bg-surface-container-lowest h-screen w-64 border-r border-outline-variant/10 flex flex-col hidden md:flex text-left">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center text-on-primary-container">
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-on-surface font-display-lg leading-none">ReviewMind</h1>
                            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mt-1">AI Intelligence</p>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        <Link className="flex items-center gap-3 px-4 py-2 text-primary bg-primary-container/10 rounded-lg font-label-md transition-transform scale-95 active:scale-100" to="/dashboard">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                            Dashboard
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-md transition-transform scale-95 active:scale-100" to="/upload">
                            <span className="material-symbols-outlined">cloud_upload</span>
                            Upload
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-md transition-transform scale-95 active:scale-100" to="/analysis">
                            <span className="material-symbols-outlined">analytics</span>
                            Analysis
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-md transition-transform scale-95 active:scale-100" to="/chat">
                            <span className="material-symbols-outlined">forum</span>
                            Chat
                        </Link>
                    </nav>
                </div>
                <div className="mt-auto p-6">
                    <Link className="w-full primary-gradient text-on-primary-container py-3 rounded-lg font-bold text-sm editorial-shadow transition-transform hover:scale-[1.02] active:scale-100 flex items-center justify-center" to="/upload">
                        New Analysis
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="md:ml-64 min-h-screen flex flex-col">
                {/* TopNavBar */}
                <header className="w-full h-16 sticky top-0 flex justify-between items-center px-8 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 font-label-md text-left">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="relative w-full max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                            <input className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-on-surface-variant/40 text-on-surface" placeholder="Search analysis, keywords..." type="text" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">help</span>
                        </button>
                        <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold leading-none text-on-surface">Alex Rivera</p>
                                <p className="text-[10px] text-on-surface-variant">Product Manager</p>
                            </div>
                            <img alt="User Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKtp3rgGFeP-AC-QBL_C89YK23-u7WIt6AHQiAm54jI4jRmDndtwCtQ63tBKW-7eG_K23IFleJeRP7m_Cer1gASEZ3bloocwwBO7eFJUZKJtCfQMJ1fJPUWFJUxNv5hFgJADYiWYlft90V23TGBaIlwZ7udHh-s3rKjdGki6xVnLr7haTFHeMqKZWH0IssdaCikFCwZ74vS6hHLOTawwmacBhwt4uw9d9aGvlVFDwWATR5TfVZH_CtdKMsudAiqJqq5QXlPfaT5fgV" />
                        </div>
                    </div>
                </header>

                {/* Dashboard Canvas */}
                <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-10 text-left">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold font-display-lg tracking-tight text-on-surface">Analysis Dashboard</h2>
                            <p className="text-on-surface-variant mt-2 text-lg">Product: <span className="font-semibold text-primary">{data?.product_name || "Real-time AI Mapping"}</span></p>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
                                <span className="material-symbols-outlined text-lg">download</span>
                                Export Report
                            </button>
                            <button className="px-4 py-2 primary-gradient text-on-primary-container rounded-lg font-bold text-sm flex items-center gap-2 editorial-shadow hover:opacity-90 transition-opacity">
                                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
                                Share Insights
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-32 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm text-center">
                            <span className="material-symbols-outlined animate-spin text-5xl text-primary mb-4">refresh</span>
                            <h3 className="text-xl font-bold text-on-surface">Processing AI Insights</h3>
                            <p className="text-on-surface-variant">Analyzing product attributes and sentiment...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-error-container/10 p-10 rounded-2xl border border-error/20 flex flex-col items-center text-center gap-4">
                            <span className="material-symbols-outlined text-5xl text-error">cloud_off</span>
                            <div>
                                <h3 className="text-xl font-bold text-on-surface">No Active Analysis</h3>
                                <p className="text-on-surface-variant mb-6">{error}</p>
                                <Link to="/upload" className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold editorial-shadow">Start New Analysis</Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Bento Grid Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Total Reviews */}
                                <div className="bg-surface-container-lowest p-6 rounded-xl editorial-shadow border border-outline-variant/10 flex flex-col justify-between h-32">
                                    <div className="flex justify-between items-start">
                                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Total Reviews</p>
                                        <span className="material-symbols-outlined text-primary/40">rate_review</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-extrabold font-headline-lg">{data.total_reviews}</p>
                                        <span className="text-emerald-400 text-xs font-bold flex items-center bg-emerald-900/30 px-1.5 py-0.5 rounded">+14%</span>
                                    </div>
                                </div>
                                {/* Sentiment Score */}
                                <div className="bg-surface-container-lowest p-6 rounded-xl editorial-shadow border border-outline-variant/10 flex flex-col justify-between h-32">
                                    <div className="flex justify-between items-start">
                                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Sentiment Score</p>
                                        <span className="material-symbols-outlined text-tertiary/40">stars</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-extrabold font-headline-lg">{data.sentiment_analysis ? data.sentiment_analysis.match(/[\d.]+\/\d+/)?.[0] || "4.2/5" : "4.2/5"}</p>
                                        <div className="flex text-primary">
                                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="material-symbols-outlined text-sm">star_half</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Active Insights */}
                                <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-xl editorial-shadow border border-outline-variant/10 relative overflow-hidden h-32">
                                    <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
                                        <svg className="h-full w-full" viewBox="0 0 100 100">
                                            <path className="text-primary" d="M0,100 C20,80 40,90 60,40 C80,10 100,20 100,0 L100,100 Z" fill="currentColor"></path>
                                        </svg>
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Top Keyword Trend</p>
                                        <div>
                                            <p className="text-xl font-bold font-headline-md truncate">{data.keyword_analysis ? data.keyword_analysis.split(',')[0].replace(/['"]/g, '').trim() : '"Ease of use"'}</p>
                                            <p className="text-on-surface-variant text-xs mt-1">Trending keyword mentioned by users</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visualization Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Sentiment Distribution Card */}
                                <div className="bg-surface-container-lowest p-8 rounded-xl editorial-shadow border border-outline-variant/10 lg:col-span-1">
                                    <h3 className="text-lg font-bold font-headline-md mb-8 text-on-surface">Sentiment Distribution</h3>
                                    <div className="relative w-48 h-48 mx-auto mb-8">
                                        <div className="w-full h-full rounded-full border-[16px] border-surface-container-high relative" style={{ background: 'conic-gradient(#adc6ff 0% 68%, #32353c 68% 85%, #93000a 85% 100%)' }}>
                                            <div className="absolute inset-0 bg-surface-container-lowest rounded-full m-1 flex items-center justify-center flex-col text-center">
                                                <span className="text-3xl font-extrabold font-headline-lg">68%</span>
                                                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Positive</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                <span className="text-on-surface font-medium">Positive</span>
                                            </div>
                                            <span className="text-on-surface-variant font-bold">8,487</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-surface-container-high"></div>
                                                <span className="text-on-surface font-medium">Neutral</span>
                                            </div>
                                            <span className="text-on-surface-variant font-bold">2,122</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-error-container"></div>
                                                <span className="text-on-surface font-medium">Negative</span>
                                            </div>
                                            <span className="text-on-surface-variant font-bold">1,873</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Sentiment Trend Card */}
                                <div className="bg-surface-container-lowest p-8 rounded-xl editorial-shadow border border-outline-variant/10 lg:col-span-2">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-lg font-bold font-headline-md text-on-surface">Sentiment Trend</h3>
                                            <p className="text-on-surface-variant text-xs">Analysis over the last 30 days</p>
                                        </div>
                                        <div className="flex bg-surface-container-low rounded-lg p-1 text-[10px] font-bold uppercase tracking-wider">
                                            <button className="px-3 py-1.5 bg-surface-container-highest rounded-md shadow-sm text-primary">30 Days</button>
                                            <button className="px-3 py-1.5 text-on-surface-variant opacity-60">90 Days</button>
                                        </div>
                                    </div>
                                    <div className="h-64 w-full relative group overflow-hidden">
                                        <div className="absolute inset-0 flex flex-col justify-between opacity-5">
                                            <div className="w-full h-[1px] bg-on-surface"></div>
                                            <div className="w-full h-[1px] bg-on-surface"></div>
                                            <div className="w-full h-[1px] bg-on-surface"></div>
                                            <div className="w-full h-[1px] bg-on-surface"></div>
                                        </div>
                                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 256">
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#adc6ff" stopOpacity="0.2"></stop>
                                                    <stop offset="100%" stopColor="#adc6ff" stopOpacity="0"></stop>
                                                </linearGradient>
                                            </defs>
                                            <path d="M0,180 Q100,140 200,160 T400,120 T600,80 T800,100 T1000,40" fill="none" stroke="#adc6ff" strokeLinecap="round" strokeWidth="3"></path>
                                            <path d="M0,180 Q100,140 200,160 T400,120 T600,80 T800,100 T1000,40 V256 H0 Z" fill="url(#chartGradient)"></path>
                                            <circle cx="200" cy="160" fill="#adc6ff" r="4" stroke="#10131a" strokeWidth="2"></circle>
                                            <circle cx="600" cy="80" fill="#adc6ff" r="4" stroke="#10131a" strokeWidth="2"></circle>
                                            <circle cx="994" cy="40" fill="#adc6ff" r="6" stroke="#10131a" strokeWidth="3"></circle>
                                        </svg>
                                        <div className="absolute top-4 right-[5%] bg-surface-container-highest text-on-surface text-[10px] px-3 py-2 rounded-lg editorial-shadow border border-outline-variant/10">
                                            <p className="font-bold">May 24 (Today)</p>
                                            <p className="opacity-70">Score: 4.8/5</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                        <span>May 01</span>
                                        <span>May 10</span>
                                        <span>May 20</span>
                                        <span>Today</span>
                                    </div>
                                </div>
                            </div>

                            {/* Insight Cloud / Core Recommendation */}
                            <div className="relative bg-surface-container-low rounded-xl p-1 overflow-hidden border border-outline-variant/10">
                                <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-lg p-10 flex flex-col md:flex-row items-center gap-10">
                                    <div className="w-full md:w-1/3 text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                                            <span className="material-symbols-outlined text-xs">bolt</span>
                                            AI Executive Summary
                                        </div>
                                        <h4 className="text-2xl font-bold font-headline-md mb-4 text-on-surface">Core Recommendation</h4>
                                        <p className="text-on-surface-variant leading-relaxed font-body-md">
                                            {data.short_summary || "Based on 12k reviews, the primary friction point is the onboarding flow for enterprise users. Resolving this could increase overall sentiment by an estimated 0.8 points."}
                                        </p>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-surface-container-low p-5 rounded-lg border-l-4 border-primary">
                                            <p className="text-xs font-bold text-primary uppercase mb-2">Key Strength</p>
                                            <p className="text-sm font-semibold text-on-surface">User Interface Design</p>
                                            <p className="text-xs text-on-surface-variant mt-1">92% satisfaction rate</p>
                                        </div>
                                        <div className="bg-surface-container-low p-5 rounded-lg border-l-4 border-error">
                                            <p className="text-xs font-bold text-error uppercase mb-2">Top Complaint</p>
                                            <p className="text-sm font-semibold text-on-surface">Load Times (Mobile)</p>
                                            <p className="text-xs text-on-surface-variant mt-1">450+ mentions this week</p>
                                        </div>
                                        <div className="bg-surface-container-low p-5 rounded-lg border-l-4 border-tertiary">
                                            <p className="text-xs font-bold text-tertiary uppercase mb-2">Emerging Request</p>
                                            <p className="text-sm font-semibold text-on-surface">Dark Mode API</p>
                                            <p className="text-xs text-on-surface-variant mt-1">+24% trend since Tuesday</p>
                                        </div>
                                        <div className="bg-surface-container-low p-5 rounded-lg border-l-4 border-emerald-500">
                                            <p className="text-xs font-bold text-emerald-400 uppercase mb-2">Customer Loyalty</p>
                                            <p className="text-sm font-semibold text-on-surface">Brand Trust</p>
                                            <p className="text-xs text-on-surface-variant mt-1">NPS Score: 78</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Reviews Table */}
                            <div className="bg-surface-container-lowest rounded-xl editorial-shadow overflow-hidden border border-outline-variant/10">
                                <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between">
                                    <h3 className="text-lg font-bold font-headline-md text-on-surface">Raw Review Samples</h3>
                                    <button className="text-primary text-sm font-semibold hover:underline">View All {data.total_reviews}</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-surface-container-low/30 text-on-surface-variant font-bold uppercase text-[10px] tracking-widest">
                                                <th className="px-8 py-4">User</th>
                                                <th className="px-8 py-4">Sentiment</th>
                                                <th className="px-8 py-4">Comment Snippet</th>
                                                <th className="px-8 py-4 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant/10">
                                            {data.retrieved_reviews && data.retrieved_reviews.map((review, i) => (
                                                <tr key={i} className="hover:bg-surface-container-high/20 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-on-surface">R{i + 1}</div>
                                                            <span className="font-medium text-on-surface">Reviewer {i + 1}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${i % 3 === 0 ? 'bg-tertiary-container text-on-tertiary-container' : i % 3 === 1 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                                            {i % 3 === 0 ? 'POSITIVE' : i % 3 === 1 ? 'NEGATIVE' : 'NEUTRAL'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-on-surface-variant italic">"{review}"</td>
                                                    <td className="px-8 py-5 text-right font-medium text-on-surface-variant">{i * 5 + 2}m ago</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Navigation Shell */}
                <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant/10 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] px-6 py-4 flex justify-between items-center z-50">
                    <Link className="flex flex-col items-center gap-1 text-primary" to="/dashboard">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                        <span className="text-[10px] font-bold uppercase">Home</span>
                    </Link>
                    <Link className="flex flex-col items-center gap-1 text-on-surface-variant opacity-60" to="/analysis">
                        <span className="material-symbols-outlined">analytics</span>
                        <span className="text-[10px] font-bold uppercase">Stats</span>
                    </Link>
                    <Link className="-mt-12 primary-gradient w-14 h-14 rounded-full flex items-center justify-center text-on-primary-container shadow-lg ring-4 ring-background" to="/upload">
                        <span className="material-symbols-outlined text-3xl">add</span>
                    </Link>
                    <Link className="flex flex-col items-center gap-1 text-on-surface-variant opacity-60" to="/chat">
                        <span className="material-symbols-outlined">forum</span>
                        <span className="text-[10px] font-bold uppercase">Chat</span>
                    </Link>
                    <Link className="flex flex-col items-center gap-1 text-on-surface-variant opacity-60" to="/settings">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-[10px] font-bold uppercase">Admin</span>
                    </Link>
                </nav>
            </main>
        </div>
    );
};

export default Dashboard_Dark;
