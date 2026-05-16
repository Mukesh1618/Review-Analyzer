import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Dashboard_Dark = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [shuffledReviews, setShuffledReviews] = useState([]);
    const [visibleCount, setVisibleCount] = useState(15);
    const [showAllModal, setShowAllModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllProducts = async () => {
        if (!user) return;
        try {
            const response = await fetch('http://127.0.0.1:8000/products', {
                headers: { 'X-User-ID': user.uid }
            });
            const products = await response.json();
            setAllProducts(products);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    const handleSelectProduct = async (productId) => {
        if (!user) return;
        try {
            setLoading(true);
            setShowResults(false);
            setSearchQuery("");
            const response = await fetch(`http://127.0.0.1:8000/select_product?product_id=${productId}`, {
                method: 'POST',
                headers: { 'X-User-ID': user.uid }
            });
            const result = await response.json();
            if (result.message) {
                // Clear cache and re-fetch analysis
                localStorage.removeItem(`reviewMindData_${user.uid}`);
                window.location.reload();
            }
        } catch (err) {
            setError("Failed to switch product.");
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            if (!user) return;
            try {
                fetchAllProducts();
                const cachedData = localStorage.getItem(`reviewMindData_${user.uid}`);
                let resultData = null;
                
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    if (parsed && parsed.sentiment_distribution && parsed.key_metrics) {
                        resultData = parsed;
                    } else {
                        localStorage.removeItem(`reviewMindData_${user.uid}`);
                    }
                }

                if (!resultData) {
                    const response = await fetch('http://127.0.0.1:8000/analyze', {
                        headers: { 'X-User-ID': user.uid }
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        // If it's a validation error (400), we MUST clear the cache to stop showing old product data
                        localStorage.removeItem(`reviewMindData_${user.uid}`);
                        setError(errorData.detail || errorData.error || "Analysis failed.");
                        setLoading(false);
                        return;
                    }

                    resultData = await response.json();
                    localStorage.setItem(`reviewMindData_${user.uid}`, JSON.stringify(resultData));
                }

                setData(resultData);
                
                // Shuffle reviews once on load
                if (resultData.retrieved_reviews) {
                    const shuffled = [...resultData.retrieved_reviews].sort(() => Math.random() - 0.5);
                    setShuffledReviews(shuffled);
                }
            } catch (err) {
                setError('Failed to connect to backend. Is the server running?');
            } finally {
                setLoading(false);
            }
        };
        
        if (user) {
            fetchData();
        }
    }, [user, authLoading, navigate]);

    const parseReview = (raw) => {
        if (!raw) return { text: '', sentiment: 'NEUTRAL', date: 'Recent' };
        let text = raw;
        let rating = 3;
        let date = 'Recent';
        try {
            const trimmed = raw.trim();
            if (trimmed.startsWith('{')) {
                const parsed = JSON.parse(trimmed);
                text = parsed.text || raw;
                rating = parsed.rating || 3;
                date = parsed.date || 'Recent';
            }
        } catch (e) {}

        // Simple logic for sentiment label display
        let sentiment = 'NEUTRAL';
        if (rating > 3) sentiment = 'POSITIVE';
        if (rating < 3) sentiment = 'NEGATIVE';

        return { text, sentiment, date };
    };

    const getSentimentColor = (sentiment) => {
        const s = sentiment?.toUpperCase();
        if (s === 'POSITIVE') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        if (s === 'NEGATIVE') return 'bg-error-container text-on-error-container border border-error/30';
        return 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30';
    };

    // Calculate dynamic donut chart with safety guards
    const dist = data?.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 };
    const totalDist = (dist.positive + dist.neutral + dist.negative) || 1;
    const posPercent = Math.round((dist.positive / totalDist) * 100);
    const neuPercent = Math.round((dist.neutral / totalDist) * 100);
    const negPercent = Math.round((dist.negative / totalDist) * 100);

    const conicGradient = `conic-gradient(#10b981 0% ${posPercent}%, #32353c ${posPercent}% ${posPercent + neuPercent}%, #ef4444 ${posPercent + neuPercent}% 100%)`;

    // Robust Score Extraction with Fallback
    const getDisplayScore = () => {
        if (!data) return "N/A";
        
        // 1. Try to extract from text with case-insensitive robust regex
        const match = data.sentiment_analysis?.match(/OVERALL SCORE:\s*([\d.]+)\/10/i);
        if (match && match[1]) return match[1];

        // 2. Fallback to calculation from distribution if text match fails
        const p = dist.positive || 0;
        const n = dist.neutral || 0;
        const total = (p + n + (dist.negative || 0)) || 1;
        const calculated = ((p + 0.5 * n) / total) * 10;
        return calculated.toFixed(1);
    };

    return (
        <div className="bg-background text-on-surface min-h-screen">
            {/* SideNavBar Shell */}
            <aside className="fixed left-0 top-0 h-full z-40 bg-surface-container-lowest h-screen w-64 border-r border-outline-variant/10 flex flex-col hidden md:flex text-left">
                <div className="p-8 text-left">
                    <div className="flex items-center gap-3 mb-10 text-left">
                        <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center text-on-primary-container">
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-on-surface font-display-lg leading-none">ReviewMind</h1>
                            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mt-1 text-left">AI Intelligence</p>
                        </div>
                    </div>
                    <nav className="space-y-1 text-left">
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
            </aside>

            {/* Main Content Area */}
            <main className="md:ml-64 min-h-screen flex flex-col">
                {/* TopNavBar */}
                <header className="w-full h-16 sticky top-0 flex justify-between items-center px-8 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 font-label-md text-left">
                    <div className="flex-1 max-w-xl mx-auto px-8">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                            <input 
                                className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-on-surface-variant/40 text-on-surface" 
                                placeholder="Search previously analyzed products..." 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                            />

                            {/* Autocomplete Dropdown */}
                            {showResults && searchQuery.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl z-[100] max-h-64 overflow-y-auto overflow-x-hidden">
                                    {allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                        allProducts
                                            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((product) => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleSelectProduct(product.id)}
                                                    className="w-full px-5 py-3 text-left hover:bg-primary/10 flex items-center gap-3 transition-colors border-b border-outline-variant/5 last:border-none"
                                                >
                                                    <span className="material-symbols-outlined text-primary text-sm">history</span>
                                                    <span className="text-on-surface font-medium text-sm">{product.name}</span>
                                                </button>
                                            ))
                                    ) : (
                                        <div className="px-5 py-4 text-on-surface-variant text-xs italic">No matching products found</div>
                                    )}
                                </div>
                            )}
                            {/* Click outside to close */}
                            {showResults && <div className="fixed inset-0 z-[90]" onClick={() => setShowResults(false)}></div>}
                        </div>
                    </div>
                </header>

                {/* Dashboard Canvas */}
                <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-10 text-left">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
                        <div>
                            <h2 className="text-3xl font-extrabold font-display-lg tracking-tight text-on-surface">Analysis Dashboard</h2>
                            <p className="text-on-surface-variant mt-2 text-lg">Product: <span className="font-semibold text-primary">{data?.product_name || "Real-time AI Mapping"}</span></p>
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
                        <div className="space-y-10 text-left">
                            {/* Bento Grid Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
                                {/* Total Reviews */}
                                <div className="bg-surface-container-lowest p-6 rounded-xl editorial-shadow border border-outline-variant/10 flex flex-col justify-between h-32">
                                    <div className="flex justify-between items-start">
                                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Total Reviews</p>
                                        <span className="material-symbols-outlined text-primary/40">rate_review</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-extrabold font-headline-lg">{data?.total_reviews || 0}</p>
                                        <span className="text-emerald-400 text-xs font-bold flex items-center bg-emerald-900/30 px-1.5 py-0.5 rounded">Verified</span>
                                    </div>
                                </div>
                                {/* Sentiment Score */}
                                <div className="bg-surface-container-lowest p-6 rounded-xl editorial-shadow border border-outline-variant/10 flex flex-col justify-between h-32">
                                    <div className="flex justify-between items-start">
                                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Sentiment Score</p>
                                        <span className="material-symbols-outlined text-tertiary/40">stars</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-extrabold font-headline-lg">{getDisplayScore()}/10</p>
                                        <div className="flex text-primary">
                                            {[...Array(5)].map((_, i) => {
                                                const score = parseFloat(getDisplayScore()) / 2;
                                                return (
                                                    <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: `'FILL' ${i + 1 <= score ? 1 : 0}` }}>
                                                        {i + 0.5 <= score && i + 1 > score ? 'star_half' : 'star'}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {/* Active Insights */}
                                <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-xl editorial-shadow border border-outline-variant/10 relative overflow-hidden h-32 text-left">
                                    <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
                                        <svg className="h-full w-full" viewBox="0 0 100 100">
                                            <path className="text-primary" d="M0,100 C20,80 40,90 60,40 C80,10 100,20 100,0 L100,100 Z" fill="currentColor"></path>
                                        </svg>
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Top Product Features</p>
                                        <div className="flex flex-wrap gap-2">
                                            {data?.keyword_analysis ? data.keyword_analysis.split(',').slice(0, 5).map((kw, i) => (
                                                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold border border-primary/20">#{kw.trim()}</span>
                                            )) : <p className="text-on-surface-variant text-xs">No features detected</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visualization Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                                {/* Sentiment Distribution Card */}
                                <div className="bg-surface-container-lowest p-8 rounded-xl editorial-shadow border border-outline-variant/10 lg:col-span-1">
                                    <h3 className="text-lg font-bold font-headline-md mb-8 text-on-surface">Sentiment Distribution</h3>
                                    <div className="relative w-48 h-48 mx-auto mb-8">
                                        <div className="w-full h-full rounded-full border-[16px] border-surface-container-high relative" style={{ background: conicGradient }}>
                                            <div className="absolute inset-0 bg-surface-container-lowest rounded-full m-1 flex items-center justify-center flex-col text-center">
                                                <span className="text-3xl font-extrabold font-headline-lg">{posPercent}%</span>
                                                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Positive</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-left">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                                <span className="text-on-surface font-medium">Positive</span>
                                            </div>
                                            <span className="text-on-surface-variant font-bold">{data?.sentiment_distribution?.positive || 0} reviews</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-surface-container-high"></div>
                                                <span className="text-on-surface font-medium">Neutral</span>
                                            </div>
                                            <span className="text-on-surface-variant font-bold">{data?.sentiment_distribution?.neutral || 0} reviews</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                <span className="text-on-surface font-medium">Negative</span>
                                            </div>
                                            <span className="text-on-surface-variant font-bold">{data?.sentiment_distribution?.negative || 0} reviews</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Sentiment Trend Card */}
                                <div className="bg-surface-container-lowest p-8 rounded-xl editorial-shadow border border-outline-variant/10 lg:col-span-2">
                                    <div className="flex items-center justify-between mb-8 text-left">
                                        <div>
                                            <h3 className="text-lg font-bold font-headline-md text-on-surface">Sentiment Trend</h3>
                                            <p className="text-on-surface-variant text-xs">AI chronological analysis of user feedback</p>
                                        </div>
                                    </div>
                                    <div className="w-full overflow-x-auto overflow-y-hidden pt-4">
                                        {data?.sentiment_trend && data.sentiment_trend.length > 0 ? (
                                            (() => {
                                                // AGGREGATE DATA BY DATE
                                                const aggregated = data.sentiment_trend.reduce((acc, curr) => {
                                                    if (!acc[curr.date]) acc[curr.date] = { sum: 0, count: 0 };
                                                    acc[curr.date].sum += curr.score;
                                                    acc[curr.date].count += 1;
                                                    return acc;
                                                }, {});

                                                const rawTrend = Object.keys(aggregated).sort().map(date => ({
                                                    date,
                                                    score: Number((aggregated[date].sum / aggregated[date].count).toFixed(1))
                                                }));

                                                // Calculate time span
                                                const minTime = new Date(rawTrend[0].date).getTime();
                                                const maxTime = new Date(rawTrend[rawTrend.length - 1].date).getTime();
                                                const timeRange = Math.max(maxTime - minTime, 86400000); // At least 1 day

                                                // DOWNSAMPLE TO MAX 24 POINTS USING BUCKETING
                                                const maxPoints = 24;
                                                let trend = rawTrend;
                                                if (rawTrend.length > maxPoints) {
                                                    const bucketDuration = timeRange / maxPoints;
                                                    trend = [];
                                                    for (let i = 0; i < maxPoints; i++) {
                                                        const bStart = minTime + i * bucketDuration;
                                                        const bEnd = minTime + (i + 1) * bucketDuration;
                                                        const inBucket = rawTrend.filter(t => {
                                                            const time = new Date(t.date).getTime();
                                                            return time >= bStart && (i === maxPoints - 1 ? time <= bEnd : time < bEnd);
                                                        });
                                                        if (inBucket.length > 0) {
                                                            const avg = inBucket.reduce((s, c) => s + c.score, 0) / inBucket.length;
                                                            // Use the date of the review in the middle of this bucket
                                                            const labelDate = inBucket[Math.floor(inBucket.length / 2)].date;
                                                            trend.push({ date: labelDate, score: Number(avg.toFixed(1)) });
                                                        }
                                                    }
                                                }

                                                // Calculate 10-12 evenly spaced dates for the labels
                                                const numLabels = 10;
                                                const gridLabels = [];
                                                for (let i = 0; i <= numLabels; i++) {
                                                    const t = minTime + (timeRange * (i / numLabels));
                                                    const dateObj = new Date(t);
                                                    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                    const x = 100 + (i / numLabels) * 950;
                                                    gridLabels.push({ x, label });
                                                }

                                                // Helper functions for positioning
                                                const getX = (dateStr) => {
                                                    const t = new Date(dateStr).getTime();
                                                    return 100 + ((t - minTime) / timeRange) * 950;
                                                };
                                                const getY = (score) => 300 - ((score || 0) * 25);

                                                return (
                                                    <svg className="w-full min-w-[700px] h-[430px] overflow-visible font-manrope" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 430">
                                                        {/* Y-axis Title */}
                                                        <text x="-150" y="40" transform="rotate(-90)" textAnchor="middle" fill="currentColor" className="text-on-surface font-extrabold text-lg tracking-wider">Sentiment Score</text>
                                                        
                                                        {/* X-axis Title */}
                                                        <text x="575" y="420" textAnchor="middle" fill="currentColor" className="text-on-surface font-extrabold text-lg tracking-wider">Date</text>

                                                        {/* Grid lines and Y labels */}
                                                        {[0, 2, 4, 6, 8, 10].map((score) => {
                                                            const y = getY(score);
                                                            return (
                                                                <g key={`grid-${score}`}>
                                                                    <text x="80" y={y + 5} textAnchor="end" fill="currentColor" className="text-on-surface text-sm font-bold">{score}</text>
                                                                    <line x1="100" y1={y} x2="1050" y2={y} stroke="currentColor" strokeWidth="1" className="text-outline-variant/50" />
                                                                </g>
                                                            );
                                                        })}

                                                        {/* X-axis Labels (Evenly Spaced Timeline) */}
                                                        {gridLabels.map((gl, i) => (
                                                            <text 
                                                                key={`xlabel-${i}`}
                                                                x={gl.x} 
                                                                y={320} 
                                                                transform={`rotate(-90 ${gl.x} 320)`} 
                                                                textAnchor="end" 
                                                                fill="currentColor" 
                                                                className="text-on-surface text-sm font-semibold"
                                                            >
                                                                {gl.label}
                                                            </text>
                                                        ))}

                                                        {/* The Line connecting the data points */}
                                                        <path
                                                            d={trend.length > 1 ?
                                                                `M ${trend.map(t => `${getX(t.date)},${getY(t.score)}`).join(' L ')}` :
                                                                `M 100,175 L 1050,175`}
                                                            fill="none" stroke="#3b82f6" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5"
                                                        />

                                                        {/* The Data Points (Square Markers) */}
                                                        {trend.map((t, i) => {
                                                            const x = getX(t.date);
                                                            const y = getY(t.score);

                                                            return (
                                                                <g key={`point-${i}`} className="group/point">
                                                                    <rect
                                                                        x={x - 4}
                                                                        y={y - 4}
                                                                        width="8"
                                                                        height="8"
                                                                        fill="#3b82f6"
                                                                        className="cursor-pointer transition-all hover:scale-150 origin-center"
                                                                        style={{ transformOrigin: `${x}px ${y}px` }}
                                                                    />
                                                                    
                                                                    {/* Tooltip */}
                                                                    <foreignObject
                                                                        x={Math.min(x - 90, 910)}
                                                                        y={Math.max(y - 115, 0)}
                                                                        width="180" height="110"
                                                                        className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none z-50"
                                                                    >
                                                                        <div className="bg-surface-container-highest border-2 border-primary/50 rounded-xl px-4 py-2 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                                                                            <p className="text-[12px] font-bold text-on-surface leading-tight mb-1 uppercase tracking-tighter opacity-70">Recorded Date</p>
                                                                            <p className="text-[14px] font-black text-on-surface leading-tight">{t.date}</p>
                                                                            <div className="mt-2 pt-2 border-t border-outline-variant/30">
                                                                                <p className="text-[16px] font-black text-primary">Score: {t.score}/10</p>
                                                                            </div>
                                                                        </div>
                                                                    </foreignObject>
                                                                </g>
                                                            );
                                                        })}
                                                    </svg>
                                                );
                                            })()
                                        ) : (
                                            <div className="h-64 w-full flex items-center justify-center text-on-surface-variant/50 italic">No trend data available</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Insight Cloud / Core Recommendation */}
                            <div className="relative bg-surface-container-low rounded-xl p-1 overflow-hidden border border-outline-variant/10 text-left">
                                <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-lg p-10 flex flex-col md:flex-row items-center gap-10">
                                    <div className="w-full md:w-1/3 text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                                            <span className="material-symbols-outlined text-xs">bolt</span>
                                            AI Executive Summary
                                        </div>
                                        <h4 className="text-2xl font-bold font-headline-md mb-4 text-on-surface">Core Recommendation</h4>
                                        <p className="text-on-surface-variant leading-relaxed font-body-md whitespace-pre-line text-left">
                                            {data?.short_summary || "Analyzing..."}
                                        </p>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                        <div className="bg-surface-container-low p-5 rounded-lg border-l-4 border-primary text-left">
                                            <p className="text-xs font-bold text-primary uppercase mb-2">Key Strength</p>
                                            <p className="text-sm font-semibold text-on-surface">{data?.key_metrics?.key_strength || "N/A"}</p>
                                        </div>
                                        <div className="bg-surface-container-low p-5 rounded-lg border-l-4 border-error text-left">
                                            <p className="text-xs font-bold text-error uppercase mb-2">Top Complaint</p>
                                            <p className="text-sm font-semibold text-on-surface">{data?.key_metrics?.top_complaint || "N/A"}</p>
                                        </div>
                                        <div className="bg-surface-container-low p-5 rounded-lg border-l-4 border-tertiary text-left">
                                            <p className="text-xs font-bold text-tertiary uppercase mb-2">Emerging Request</p>
                                            <p className="text-sm font-semibold text-on-surface">{data?.key_metrics?.emerging_request || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Reviews Table */}
                            <div className="bg-surface-container-lowest rounded-xl editorial-shadow overflow-hidden border border-outline-variant/10 text-left">
                                <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between">
                                    <h3 className="text-lg font-bold font-headline-md text-on-surface">Raw Review Samples</h3>
                                    <button 
                                        onClick={() => setShowAllModal(true)}
                                        className="text-primary text-sm font-semibold hover:underline"
                                    >
                                        View All ({data?.total_reviews || 0})
                                    </button>
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
                                            {shuffledReviews.slice(0, visibleCount).map((raw, i) => {
                                                const review = parseReview(raw);
                                                return (
                                                    <tr key={i} className="hover:bg-surface-container-high/20 transition-colors">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-on-surface">R{i + 1}</div>
                                                                <span className="font-medium text-on-surface">Reviewer {i + 1}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getSentimentColor(review.sentiment)}`}>
                                                                {review.sentiment || 'NEUTRAL'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-on-surface-variant italic">{review.text}</td>
                                                        <td className="px-8 py-5 text-right font-medium text-on-surface-variant">{review.date}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {shuffledReviews.length > visibleCount && (
                                    <div className="p-6 border-t border-outline-variant/10 flex justify-center">
                                        <button 
                                            onClick={() => setVisibleCount(prev => prev + 15)}
                                            className="px-6 py-2 bg-surface-container-high text-primary font-bold rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">expand_more</span>
                                            See More Reviews
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* View All Reviews Modal */}
            {showAllModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div 
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        onClick={() => setShowAllModal(false)}
                    ></div>
                    <div className="relative w-full max-w-5xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 flex flex-col max-h-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest">
                            <div>
                                <h3 className="text-2xl font-bold text-on-surface">All {data?.total_reviews || 0} Reviews</h3>
                                <p className="text-on-surface-variant text-sm">Comprehensive list for {data?.product_name || 'Product'}</p>
                            </div>
                            <button 
                                onClick={() => setShowAllModal(false)}
                                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-error/10 hover:text-error transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Content - Scrollable Table */}
                        <div className="flex-1 overflow-auto bg-surface-container-lowest">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 z-10 bg-surface-container-low shadow-sm">
                                    <tr className="text-on-surface-variant font-bold uppercase text-[10px] tracking-widest">
                                        <th className="px-8 py-4">User</th>
                                        <th className="px-8 py-4">Sentiment</th>
                                        <th className="px-8 py-4">Review Content</th>
                                        <th className="px-8 py-4 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10">
                                    {data?.retrieved_reviews && data.retrieved_reviews.map((raw, i) => {
                                        const review = parseReview(raw);
                                        return (
                                            <tr key={i} className="hover:bg-surface-container-high/20 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-on-surface">R{i + 1}</div>
                                                        <span className="font-medium text-on-surface whitespace-nowrap">Reviewer {i + 1}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getSentimentColor(review.sentiment)}`}>
                                                        {review.sentiment || 'NEUTRAL'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-on-surface leading-relaxed">{review.text}</td>
                                                <td className="px-8 py-5 text-right font-medium text-on-surface-variant whitespace-nowrap">{review.date}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="px-8 py-4 bg-surface-container-low border-t border-outline-variant/10 flex justify-end">
                            <button 
                                onClick={() => setShowAllModal(false)}
                                className="px-8 py-2 bg-primary text-on-primary font-bold rounded-lg hover:shadow-lg transition-all"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard_Dark;
