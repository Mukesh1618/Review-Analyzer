import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';

const AnalysisResults_Dark = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
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
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    if (parsed && parsed.sentiment_distribution) {
                        setData(parsed);
                        setLoading(false);
                        return;
                    }
                }
                const response = await fetch('http://127.0.0.1:8000/analyze', {
                    headers: { 'X-User-ID': user.uid }
                });
                const json = await response.json();
                if (json.error) {
                    setError(json.error);
                } else {
                    setData(json);
                    localStorage.setItem(`reviewMindData_${user.uid}`, JSON.stringify(json));
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

        let sentiment = 'NEUTRAL';
        if (rating > 3) sentiment = 'POSITIVE';
        if (rating < 3) sentiment = 'NEGATIVE';

        return { text, sentiment, date };
    };

    const getSentimentColor = (sentiment) => {
        const s = sentiment?.toUpperCase();
        if (s === 'POSITIVE') return 'bg-tertiary-container text-on-tertiary-container';
        if (s === 'NEGATIVE') return 'bg-error-container text-on-error-container';
        return 'bg-surface-container-high text-on-surface-variant';
    };

    return (
        <div className="bg-background text-on-surface min-h-screen">
            {/* SideNavBar Shell */}
            <aside className="fixed left-0 top-0 h-full z-40 bg-surface-container-lowest w-64 border-r border-outline-variant/10 flex flex-col hidden md:flex text-left font-manrope">
                <div className="p-8 text-left">
                    <div className="flex items-center gap-3 mb-10 text-left">
                        <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center text-on-primary-container shadow-sm">
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-on-surface font-display-lg leading-none">ReviewMind</h1>
                            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mt-1 text-left">AI Intelligence</p>
                        </div>
                    </div>
                    <nav className="space-y-1 text-left">
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-md transition-transform scale-95 active:scale-100" to="/dashboard">
                            <span className="material-symbols-outlined">dashboard</span>
                            Dashboard
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-md transition-transform scale-95 active:scale-100" to="/upload">
                            <span className="material-symbols-outlined">cloud_upload</span>
                            Upload
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-primary bg-primary-container/10 rounded-lg font-label-md transition-transform scale-95 active:scale-100" to="/analysis">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
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
                                <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl z-[100] max-h-64 overflow-y-auto">
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

                <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-10 text-left font-manrope">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
                        <div>
                            <h2 className="text-3xl font-extrabold font-display-lg tracking-tight text-on-surface">Deep Analysis Report</h2>
                            <p className="text-on-surface-variant mt-2 text-lg">Product: <span className="font-semibold text-primary">{data?.product_name || "Real-time AI Mapping"}</span></p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-32 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm text-center">
                            <span className="material-symbols-outlined animate-spin text-5xl text-primary mb-4">refresh</span>
                            <h3 className="text-xl font-bold text-on-surface">Generating Insights</h3>
                            <p className="text-on-surface-variant">Synthesizing comprehensive review data...</p>
                        </div>
                    ) : error || !data ? (
                        <div className="bg-surface-container-lowest p-16 rounded-[2.5rem] editorial-shadow border border-outline-variant/10 flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
                            <div className="w-20 h-20 bg-error-container/10 rounded-full flex items-center justify-center text-error border border-error/20">
                                <span className="material-symbols-outlined text-4xl">analytics</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-on-surface mb-2">No Active Analysis</h3>
                                <p className="text-on-surface-variant mb-8 max-w-sm">{error || "No data available."}</p>
                                <Link to="/upload" className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-fixed-dim transition-all">
                                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                    Start New Analysis
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Executive Summary Section */}
                            <section className="bg-surface-container-lowest rounded-[2.5rem] p-10 editorial-shadow border border-outline-variant/10 relative overflow-hidden text-left">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <span className="material-symbols-outlined text-[120px] text-primary">auto_awesome</span>
                                </div>
                                <div className="relative z-10 max-w-3xl text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 border border-primary/20">
                                        <span className="material-symbols-outlined text-xs">description</span>
                                        Executive Intelligence
                                    </div>
                                    <h3 className="text-2xl font-bold mb-6 text-on-surface">Final Product Synthesis</h3>
                                    <div className="prose prose-invert prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:text-lg max-w-none text-left">
                                        <ReactMarkdown>{data?.detailed_summary || "Analysis in progress..."}</ReactMarkdown>
                                    </div>
                                </div>
                            </section>

                            {/* Detailed Breakdown Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                                {/* Pros & Cons */}
                                <div className="space-y-8 text-left">
                                    <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 editorial-shadow text-left">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                <span className="material-symbols-outlined">thumb_up</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-on-surface">Key Strengths</h4>
                                        </div>
                                        <div className="prose prose-invert prose-li:text-on-surface-variant prose-li:mb-2 text-left">
                                            <ReactMarkdown>{data?.pros || "No strengths identified."}</ReactMarkdown>
                                        </div>
                                    </div>

                                    <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 editorial-shadow text-left">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20">
                                                <span className="material-symbols-outlined">thumb_down</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-on-surface">Critical Weaknesses</h4>
                                        </div>
                                        <div className="prose prose-invert prose-li:text-on-surface-variant prose-li:mb-2 text-left">
                                            <ReactMarkdown>{data?.cons || "No weaknesses identified."}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>

                                {/* Aspect Mapping & Security */}
                                <div className="space-y-8 text-left">
                                    <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 editorial-shadow text-left">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                                <span className="material-symbols-outlined">monitoring</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-on-surface">Aspect Mapping</h4>
                                        </div>
                                        <div className="prose prose-invert prose-p:text-on-surface-variant text-left">
                                            <ReactMarkdown>{data?.aspect_analysis || "No aspect analysis available."}</ReactMarkdown>
                                        </div>
                                    </div>

                                    <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 editorial-shadow text-left">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-tertiary/10 rounded-xl flex items-center justify-center text-tertiary border border-tertiary/20">
                                                <span className="material-symbols-outlined">security</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-on-surface">Authenticity Report</h4>
                                        </div>
                                        <div className="prose prose-invert prose-p:text-on-surface-variant text-left">
                                            <ReactMarkdown>{data?.fake_review_analysis || "No security analysis available."}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AnalysisResults_Dark;
