import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FileUpload_Dark = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setMessage('');
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select a file first.");
            return;
        }
        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setMessage(data.message || "Upload successful!");
            localStorage.removeItem('reviewMindData');

            setTimeout(() => {                navigate('/dashboard');
            }, 1500);
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage("Error uploading file. Make sure backend is running.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-on-background">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full z-40 bg-surface-container-lowest w-64 border-r border-outline-variant/20 font-manrope text-sm font-medium hidden md:flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-10 text-left">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-on-surface">ReviewMind</div>
                            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">AI Intelligence</div>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors scale-95 active:scale-100 transition-transform" to="/dashboard">
                            <span className="material-symbols-outlined">dashboard</span>
                            Dashboard
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-primary bg-primary-container/20 rounded-lg scale-95 active:scale-100 transition-transform" to="/upload">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                            Upload
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors scale-95 active:scale-100 transition-transform" to="/analysis">
                            <span className="material-symbols-outlined">analytics</span>
                            Analysis
                        </Link>
                        <Link className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors scale-95 active:scale-100 transition-transform" to="/chat">
                            <span className="material-symbols-outlined">forum</span>
                            Chat
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 flex-1 min-h-screen">
                <header className="w-full h-16 sticky top-0 bg-background/80 backdrop-blur-md flex justify-between items-center px-8 z-30 border-b border-outline-variant/10 font-manrope text-sm">
                    <div className="flex items-center gap-4 flex-1 text-left">
                        <div className="relative w-full max-w-md group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-xs focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50" placeholder="Search analysis, files, or reports..." type="text" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">help</span>
                            </button>
                        </div>
                        <div className="h-8 w-[1px] bg-outline-variant/20"></div>
                        <div className="flex items-center gap-3 text-left pl-2">
                            <div className="text-right">
                                <div className="font-bold text-on-surface leading-none">Alex Rivera</div>
                                <div className="text-[10px] text-on-surface-variant">Admin Plan</div>
                            </div>
                            <img alt="User Profile" className="w-10 h-10 rounded-full border-2 border-primary/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDy1XSxNQDxH9AMVdFa4y5Kx1A-MXyOrWGFqOMq8ctbz1AwY9_fsoODaQ3fK9aar6udTut6mxi4O3vmOkLopb-NLf6zjXZ4F0d7eLE-TrPt87LTzlfTlkimrVLKV0SSaJsmiuaNC94cS-rgm_nUl2Nxqe5nqntcQ4H2wivqMHfTE5eO1KhNZIhbeBOXeMDjINArRNjEwluNwFagqOsgri0f8FiXgK2MGEFpNzLzqvqnO0gTMpcJZ22mcX0lLIhOan4Eg4C5uHIqF0PJ" />
                        </div>
                    </div>
                </header>

                <section className="p-12 max-w-6xl mx-auto text-left">
                    <div className="mb-12">
                        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Knowledge Ingestion</h1>
                        <p className="text-on-surface-variant text-lg">Upload your review datasets to generate high-fidelity AI insights.</p>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-8">
                            <div 
                                onClick={handleUploadClick}
                                className="group relative bg-surface-container border-2 border-dashed border-outline-variant/30 rounded-xl p-16 flex flex-col items-center justify-center text-center transition-all hover:border-primary/50 hover:bg-primary-container/5 cursor-pointer"
                            >
                                <div className="w-20 h-20 bg-primary-container/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                                </div>
                                <h3 className="text-2xl font-bold text-on-surface mb-2">{file ? file.name : "Drag and drop your review files here"}</h3>
                                <p className="text-on-surface-variant mb-8 max-w-sm">Or click to browse your computer for local files to begin the intelligence mapping process.</p>
                                
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept=".csv,.txt,.json" 
                                />

                                <div className="flex gap-4 mb-8">
                                    <span className="px-4 py-1.5 bg-surface-container-high text-on-surface-variant text-xs font-semibold rounded-full">Supports CSV</span>
                                    <span className="px-4 py-1.5 bg-surface-container-high text-on-surface-variant text-xs font-semibold rounded-full">Supports JSON</span>
                                    <span className="px-4 py-1.5 bg-surface-container-high text-on-surface-variant text-xs font-semibold rounded-full">Supports TXT</span>
                                </div>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); file ? handleUpload() : handleUploadClick(); }}
                                    disabled={uploading}
                                    className="px-8 py-3 bg-primary text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
                                >
                                    {uploading ? "Uploading..." : file ? "Start Analysis" : "Select Files"}
                                </button>
                                {message && <p className="mt-4 text-sm font-semibold text-primary">{message}</p>}
                                <div className="absolute inset-0 border-2 border-primary rounded-xl opacity-0 group-active:opacity-100 transition-opacity pointer-events-none scale-[1.01]"></div>
                            </div>

                            <div className="mt-8 grid grid-cols-3 gap-4">
                                <div className="p-6 bg-surface-container-low rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">security</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs uppercase tracking-wider text-on-surface-variant/50">Privacy</div>
                                        <div className="text-sm font-semibold text-on-surface">AES-256 Encrypted</div>
                                    </div>
                                </div>
                                <div className="p-6 bg-surface-container-low rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">speed</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs uppercase tracking-wider text-on-surface-variant/50">Speed</div>
                                        <div className="text-sm font-semibold text-on-surface">Real-time Parsing</div>
                                    </div>
                                </div>
                                <div className="p-6 bg-surface-container-low rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">hub</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs uppercase tracking-wider text-on-surface-variant/50">Logic</div>
                                        <div className="text-sm font-semibold text-on-surface">NLP Pre-processing</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <div className="bg-surface-container-low rounded-xl p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-extrabold tracking-tight text-on-surface">Sample Files</h2>
                                    <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded uppercase">Quick Start</span>
                                </div>
                                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Don't have a dataset ready? Use our curated samples to see the AI analysis in action.</p>
                                <div className="space-y-3">
                                    <div className="p-4 bg-surface-container-lowest rounded-lg group hover:ring-2 ring-primary/30 cursor-pointer transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-secondary">description</span>
                                            <div>
                                                <div className="text-sm font-bold text-on-surface">E-commerce Reviews</div>
                                                <div className="text-[10px] text-on-surface-variant">5,000 rows • CSV</div>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">download</span>
                                    </div>
                                    <div className="p-4 bg-surface-container-lowest rounded-lg group hover:ring-2 ring-primary/30 cursor-pointer transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-secondary">description</span>
                                            <div>
                                                <div className="text-sm font-bold text-on-surface">App Store Sentiment</div>
                                                <div className="text-[10px] text-on-surface-variant">12,400 rows • JSON</div>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">download</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-primary-container to-primary-fixed-dim rounded-xl p-8 text-on-primary-container shadow-xl shadow-primary/10 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold mb-2">Need a custom integration?</h3>
                                    <p className="text-on-primary-container/80 text-sm mb-6">Connect directly to your AWS S3, Google Cloud Storage, or Azure Blob containers.</p>
                                    <button className="w-full py-2 bg-on-primary-container/10 backdrop-blur-md rounded-lg text-xs font-bold hover:bg-on-primary-container/20 transition-colors uppercase tracking-widest border border-on-primary-container/20">Connect Cloud Storage</button>
                                </div>
                                <div className="absolute -bottom-6 -right-6 opacity-20 transform rotate-12">
                                    <span className="material-symbols-outlined text-9xl">cloud_sync</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-outline-variant/10">
                        <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-outline-variant/10">
                            <div className="w-full md:w-1/3">
                                <img alt="Data Visualization Dashboard" className="rounded-xl shadow-lg opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjQJAQ1NUmu787rCCzAh3x4zCGc1p3jrGoJNycTV9GibeN9AFi28ZLxcLbID2XMT7vHnCMnYVi2xi9ZXYjM9-aatVZwmwIC30gcY33NRuXUhxjW9muD8_2lVHsFuboQrPLFUGw5viyoxYkGUvaF83mUECXchINv2T8IRZ0mlDmMR-RpwN7jZUo8RpSjbyHRm5nUKK_XrJnUagU6E8IyNr0nDDf9NOgyfB0OPlgm5y3Sh-ZvIJYN1-pk0DeI72LjBlpdTrXMCrzy3fy" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full mb-4">
                                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                    AI POWERED
                                </div>
                                <h2 className="text-2xl font-bold mb-4 tracking-tight text-on-surface">Advanced Sentiment Mapping</h2>
                                <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">Our AI doesn't just read words; it understands intent. Once you upload your files, we automatically categorize feedback by emotion, urgency, and product feature impact without you writing a single line of code.</p>
                                <div className="flex items-center gap-6">
                                    <div className="flex -space-x-3">
                                        <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary/20 flex items-center justify-center text-[10px] font-bold">AR</div>
                                        <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-secondary/20 flex items-center justify-center text-[10px] font-bold">SK</div>
                                        <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-tertiary/20 flex items-center justify-center text-[10px] font-bold">MT</div>
                                    </div>
                                    <span className="text-xs text-on-surface-variant font-medium">Trusted by 2,000+ data teams worldwide</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FileUpload_Dark;
