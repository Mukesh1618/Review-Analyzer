import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const AnalysisResults_Dark = () => {
    const [data, setData] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllProducts = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/products');
            const products = await response.json();
            setAllProducts(products);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    const handleSelectProduct = async (productId) => {
        try {
            setLoading(true);
            setShowResults(false);
            setSearchQuery("");
            const response = await fetch(`http://127.0.0.1:8000/select_product?product_id=${productId}`, {
                method: 'POST'
            });
            const result = await response.json();
            if (result.message) {
                // Clear cache and re-fetch analysis
                localStorage.removeItem('reviewMindData');
                window.location.reload();
            }
        } catch (err) {
            setError("Failed to switch product.");
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                fetchAllProducts();
                const cachedData = localStorage.getItem('reviewMindData');
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    if (parsed && parsed.sentiment_distribution) {
                        setData(parsed);
                        setLoading(false);
                        return;
                    }
                }
                const response = await fetch('http://127.0.0.1:8000/analyze');
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
                <div className="flex flex-col h-full p-6 text-left">
                    <div className="mb-10 flex items-center gap-3 text-left">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-on-surface text-left">ReviewMind</div>
                            <div className="text-xs text-on-surface-variant text-left">AI Intelligence</div>
                        </div>
                    </div>
                    <nav className="flex-1 space-y-2 text-left">
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
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-64 min-h-screen flex-1 text-left">
                {/* TopNavBar */}
                <header className="w-full h-16 sticky top-0 flex justify-between items-center px-8 z-30 bg-background/80 backdrop-blur-md border-b border-outline-variant/10 text-left">
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
                                <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl z-[100] max-h-64 overflow-y-auto overflow-x-hidden text-left">
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

                {/* Canvas */}
                <div className="p-10 space-y-10 text-left">
                    {/* Page Header */}
                    <div className="flex justify-between items-end text-left">
                        <div>
                            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight text-left">Review <span className="text-primary">Analysis</span></h1>
                            <p className="text-on-surface-variant mt-2 max-w-2xl text-left">Product: <span className="font-semibold text-primary">{data?.product_name || "Neural Sentiment Mapping"}</span></p>
                            <p className="text-xs text-on-surface-variant mt-1 text-left">A comprehensive breakdown of {data?.total_reviews || 0} verified customer reviews.</p>
                        </div>
                    </div>

                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-12 gap-6 text-left">
                        {/* AI Summary */}
                        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 relative overflow-hidden text-left">
                            <div className="flex items-center gap-2 mb-6 text-left">
                                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>magic_button</span>
                                <h2 className="text-xl font-bold">Executive AI Summary</h2>
                            </div>
                            <div className="prose prose-invert max-w-none text-lg leading-relaxed text-on-surface-variant text-left">
                                <ReactMarkdown>
                                    {data?.detailed_summary || data?.short_summary || "No summary available."}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Trust Score */}
                        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl p-8 border-l-4 border-primary border-y border-r border-outline-variant/10 text-left h-fit">
                            <h2 className="text-xl font-bold mb-8">Trust Score</h2>
                            <div className="flex items-center justify-center py-4">
                                <div className="relative flex items-center justify-center">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle className="text-surface-container-high" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                                        <circle className="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset={364.4 * (1 - (parseInt(data?.fake_review_analysis?.match(/Trust Score: (\d+)/)?.[1]) || 92) / 100)} strokeWidth="8"></circle>
                                    </svg>
                                    <span className="absolute text-3xl font-extrabold text-on-surface">{data?.fake_review_analysis?.match(/Trust Score: (\d+)/)?.[1] || "92"}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Aspect Sentiment */}
                        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 text-left">
                            <h2 className="text-xl font-bold mb-8">Sentiment by Aspect</h2>
                            <div className="space-y-6 text-left">
                                {data?.aspect_analysis && data.aspect_analysis.split('\n').filter(l => l.includes('/10')).map((line, idx) => {
                                    const name = line.match(/\*\*([^*]+)\*\*/)?.[1] || "Aspect";
                                    const score = line.match(/(\d+)\/10/)?.[1] || 5;
                                    const p = parseInt(score) * 10;
                                    return (
                                        <div key={idx} className="space-y-2 text-left">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{name}</span>
                                                <span className="text-on-surface-variant">{p}% Positive</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex">
                                                <div className="h-full bg-primary" style={{ width: `${p}%` }}></div>
                                                <div className="h-full bg-error-container" style={{ width: `${100 - p}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pros & Cons */}
                        <div className="col-span-12 lg:col-span-5 grid grid-rows-2 gap-6 text-left h-fit">
                            <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-6 text-left">
                                <div className="flex items-center gap-2 mb-4 text-primary text-left">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    <h3 className="font-bold">Key Pros</h3>
                                </div>
                                <div className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed text-left">
                                    {data?.pros || "No pros detected."}
                                </div>
                            </div>
                            <div className="bg-error-container/10 border border-error-container/20 rounded-xl p-6 text-left">
                                <div className="flex items-center gap-2 mb-4 text-error text-left">
                                    <span className="material-symbols-outlined">remove_circle</span>
                                    <h3 className="font-bold text-on-error-container">Key Cons</h3>
                                </div>
                                <div className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed text-left">
                                    {data?.cons || "No cons detected."}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant/10 rounded-xl overflow-hidden text-left">
                            <div className="p-8 pb-4 text-left">
                                <h2 className="text-xl font-bold">Latest Sentiment Samples</h2>
                            </div>
                            <div className="overflow-x-auto text-left">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider text-left">
                                            <th className="px-8 py-4 font-bold">Review Snippet</th>
                                            <th className="px-8 py-4 font-bold">Sentiment</th>
                                            <th className="px-8 py-4 font-bold">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10 text-left">
                                        {data?.retrieved_reviews && data.retrieved_reviews.slice(0, 10).map((raw, i) => {
                                            const r = parseReview(raw);
                                            return (
                                                <tr key={i} className="hover:bg-surface-container-high transition-colors text-left">
                                                    <td className="px-8 py-5 text-sm text-left">{r.text}</td>
                                                    <td className="px-8 py-5 text-left">
                                                        <span className={`px-2 py-1 text-xs font-bold rounded ${getSentimentColor(r.sentiment)}`}>
                                                            {r.sentiment}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm text-on-surface-variant italic text-left">{r.date}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AnalysisResults_Dark;
