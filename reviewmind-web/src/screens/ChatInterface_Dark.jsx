import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ChatInterface_Dark = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const [threadId] = useState(`session_${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (selectedProduct && !loading) {
            inputRef.current?.focus();
        }
    }, [selectedProduct, loading]);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:8000/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleSelectProduct = async (product) => {
        try {
            await fetch(`http://localhost:8000/select_product?product_id=${product.id}`, { method: 'POST' });
            setSelectedProduct(product);
            setMessages([{
                role: 'assistant',
                content: `Chat started for ${product.name}. How can I help you analyze the reviews? (Type 'end' to reset)`
            }]);
        } catch (error) {
            console.error("Error selecting product:", error);
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() || !selectedProduct) return;

        const userMsg = inputValue.trim();
        if (userMsg.toLowerCase() === 'end') {
            setSelectedProduct(null);
            setMessages([]);
            setInput('');
            return;
        }

        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, thread_id: threadId })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI." }]);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex min-h-screen bg-surface text-on-surface">
            {/* SideNavBar */}
            <aside className="fixed left-0 top-0 h-full z-40 w-64 border-r border-outline-variant/10 bg-surface-container-low flex flex-col hidden md:flex text-left">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary shadow-lg">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-on-surface leading-tight">ReviewMind</div>
                        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">AI Intelligence</div>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-2">
                    <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg scale-95 active:scale-100" to="/dashboard">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span>Dashboard</span>
                    </Link>
                    <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg scale-95 active:scale-100" to="/upload">
                        <span className="material-symbols-outlined">cloud_upload</span>
                        <span>Upload</span>
                    </Link>
                    <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg scale-95 active:scale-100" to="/analysis">
                        <span className="material-symbols-outlined">analytics</span>
                        <span>Analysis</span>
                    </Link>
                    <Link className="flex items-center gap-3 px-4 py-2 text-primary bg-primary-container/20 rounded-lg scale-95 active:scale-100 transition-all" to="/chat">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                        <span>Chat</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col md:ml-64 h-screen relative bg-surface min-w-0">
                {/* TopNavBar */}
                <header className="w-full h-16 sticky top-0 flex justify-between items-center px-8 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 font-manrope text-sm text-left">
                    <div className="flex items-center gap-6">
                        <div className="relative flex items-center bg-surface-container rounded-full px-4 py-1.5 w-72">
                            <span className="material-symbols-outlined text-on-surface-variant text-lg mr-2">search</span>
                            <input
                                className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface placeholder:text-on-surface-variant/50"
                                placeholder="Search products..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && !selectedProduct && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-highest rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden z-50">
                                    {filteredProducts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelectProduct(p)}
                                            className="w-full px-4 py-3 text-left hover:bg-primary/10 flex items-center gap-3 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-primary text-sm">inventory_2</span>
                                            <span className="text-sm font-medium">{p.name}</span>
                                        </button>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="px-4 py-3 text-xs text-on-surface-variant">No products found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-left">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold leading-none text-on-surface">Active Session</p>
                                <p className="text-[10px] text-primary">{selectedProduct ? selectedProduct.name : 'Select Product'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {!selectedProduct ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center text-primary mb-2">
                            <span className="material-symbols-outlined text-5xl">forum</span>
                        </div>
                        <h2 className="text-3xl font-bold">Product Feedback Chat</h2>
                        <p className="text-on-surface-variant max-w-md">Search and select a product from your previous uploads to start a conversation about user reviews.</p>
                        <div className="w-full max-w-sm space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant text-left ml-2">Previously Uploaded</p>
                            <div className="grid gap-2">
                                {products.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectProduct(p)}
                                        className="flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl hover:bg-surface-container-high transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center group-hover:text-primary">
                                            <span className="material-symbols-outlined">inventory_2</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{p.name}</p>
                                            <p className="text-[10px] text-on-surface-variant">Click to start chatting</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <section className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-8 space-y-8 pb-48 mx-auto w-full max-w-5xl">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {msg.role === 'assistant' && (
                                            <div className="w-6 h-6 bg-primary-container rounded flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xs text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                                            </div>
                                        )}
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                            {msg.role === 'user' ? 'You' : 'ReviewMind AI'}
                                        </span>
                                    </div>
                                    <div className={`${msg.role === 'user' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface border border-outline-variant/10'} px-6 py-4 rounded-2xl max-w-[85%] shadow-sm text-left`}>
                                        {msg.role === 'user' ? (
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        ) : (
                                            <div className="prose prose-invert max-w-none text-on-surface leading-relaxed">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex flex-col items-start space-y-2 animate-pulse">
                                    <div className="w-6 h-6 bg-surface-container-high rounded"></div>
                                    <div className="bg-surface-container-low h-12 w-32 rounded-2xl"></div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </section>

                        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-6 bg-gradient-to-t from-surface via-surface to-transparent z-40">
                            <div className="max-w-4xl mx-auto relative group">
                                <div className="relative flex items-center bg-surface-container-highest rounded-xl shadow-2xl border border-outline-variant/10 p-2">
                                    <input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface py-3 px-4 font-body placeholder:text-on-surface-variant/40"
                                        placeholder={`Ask about ${selectedProduct.name}... (Type 'end' to exit)`}
                                        type="text"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={loading || !inputValue.trim()}
                                        className="bg-primary text-on-primary p-3 rounded-lg flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </div>
                                <div className="flex justify-center gap-3 mt-4">
                                    <button onClick={() => { setInput("What are the top complaints?"); inputRef.current?.focus(); }} className="text-[11px] font-bold text-on-tertiary-container bg-tertiary-container px-4 py-1.5 rounded-full hover:brightness-110">Top Complaints</button>
                                    <button onClick={() => { setInput("What do users love about it?"); inputRef.current?.focus(); }} className="text-[11px] font-bold text-on-tertiary-container bg-tertiary-container px-4 py-1.5 rounded-full hover:brightness-110">User Loves</button>
                                    <button onClick={() => { setInput('end'); setTimeout(handleSend, 0); }} className="text-[11px] font-bold text-on-error-container bg-error-container/20 px-4 py-1.5 rounded-full hover:bg-error-container/40">End Chat</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ChatInterface_Dark;
