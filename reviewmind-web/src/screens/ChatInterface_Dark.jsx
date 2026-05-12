import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ChatInterface_Dark = () => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm your ReviewMind AI assistant. Select a product from your previous analyses and ask me anything about user feedback."
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [threadId] = useState(`thread_${Math.random().toString(36).substring(7)}`);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProductList, setShowProductList] = useState(false);
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!loading && selectedProduct) {
            inputRef.current?.focus();
        }
    }, [loading, selectedProduct]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleSelectProduct = async (product) => {
        try {
            await fetch(`http://127.0.0.1:8000/select_product?product_id=${product.id}`, { method: 'POST' });
            setSelectedProduct(product);
            setMessages([{
                role: 'assistant',
                content: `You're now chatting about **${product.name}**. How can I help you analyze these reviews?`
            }]);
            setShowProductList(false);
        } catch (error) {
            console.error('Error selecting product:', error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading || !selectedProduct) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, thread_id: threadId })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the brain. Is the server running?" }]);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-background text-on-surface min-h-screen flex">
            {/* SideNavBar Shell */}
            <aside className="fixed left-0 top-0 h-full z-40 bg-surface-container-lowest w-64 border-r border-outline-variant/10 flex flex-col hidden md:flex text-left">
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
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-md transition-transform scale-95 active:scale-100" to="/dashboard">
                            <span className="material-symbols-outlined">dashboard</span>
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
                        <Link className="flex items-center gap-3 px-4 py-2 text-primary bg-primary-container/10 rounded-lg font-label-md transition-transform scale-95 active:scale-100" to="/chat">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                            Chat
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="md:ml-64 flex-1 flex flex-col h-screen overflow-hidden">
                {/* Chat Header */}
                <header className="h-16 flex justify-between items-center px-8 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 text-left">
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-sm">robot_2</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-on-surface">ReviewMind Analyst</h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Systems Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => setShowProductList(!showProductList)}
                            className="px-4 py-2 bg-surface-container rounded-lg border border-outline-variant/10 text-xs font-bold flex items-center gap-2 hover:bg-surface-container-high transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                            {selectedProduct ? selectedProduct.name : "Select Product"}
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>
                        
                        {showProductList && (
                            <div className="absolute right-0 mt-2 w-72 bg-surface-container-highest border border-outline-variant/20 rounded-xl shadow-2xl z-50 overflow-hidden text-left">
                                <div className="p-3 border-b border-outline-variant/10">
                                    <input 
                                        type="text"
                                        placeholder="Search products..."
                                        className="w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary/30"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {filteredProducts.length > 0 ? filteredProducts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelectProduct(p)}
                                            className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-3 group border-b border-outline-variant/5 last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-sm">laptop_mac</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-on-surface">{p.name}</p>
                                                <p className="text-[10px] text-on-surface-variant">Click to analyze</p>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="p-4 text-center text-on-surface-variant text-[10px] font-bold uppercase italic opacity-50">No products found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Messages Window */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide text-left">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl ${
                                msg.role === 'user' 
                                ? 'bg-primary text-on-primary rounded-tr-none editorial-shadow' 
                                : 'bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/10'
                            }`}>
                                <div className={`text-sm leading-relaxed text-left prose prose-invert max-w-none ${msg.role === 'user' ? 'prose-p:text-on-primary' : 'prose-p:text-on-surface'}`}>
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-surface-container-high p-4 rounded-2xl rounded-tl-none border border-outline-variant/10">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-8 pt-0 text-left">
                    <form 
                        onSubmit={handleSend}
                        className="relative max-w-4xl mx-auto group"
                    >
                        <textarea 
                            ref={inputRef}
                            rows="1"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={!selectedProduct || loading}
                            placeholder={selectedProduct ? "Ask about features, battery, design..." : "Select a product above first"}
                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-6 py-4 pr-16 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none shadow-2xl disabled:opacity-50"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || loading || !selectedProduct}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 primary-gradient rounded-xl flex items-center justify-center text-on-primary shadow-lg disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-on-surface-variant/40 mt-4 font-bold uppercase tracking-widest">
                        Powered by ReviewMind AI • Ver. 2.1.0
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ChatInterface_Dark;
