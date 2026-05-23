import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const FileUpload_Dark = () => {
    const { user, loading: authLoading } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

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
        if (!file || !user) {
            setMessage("Please select a file first.");
            return;
        }
        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/upload', {
                method: 'POST',
                headers: { 'X-User-ID': user.uid },
                body: formData,
            });
            const data = await response.json();
            if (data.error || !response.ok) {
                setMessage(data.error || "Upload failed. Please try again.");
            } else {
                setMessage(data.message || "Upload successful!");
                localStorage.removeItem(`reviewMindData_${user.uid}`);
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage("Error uploading file. Make sure backend is running.");
        } finally {
            setUploading(false);
        }
    };

    const handleSampleUpload = async (sampleName) => {
        if (!user) return;
        setUploading(true);
        setMessage(`Loading sample: ${sampleName}...`);

        try {
            const response = await fetch(`http://127.0.0.1:8000/upload_sample?sample_name=${sampleName}`, {
                method: 'POST',
                headers: { 'X-User-ID': user.uid }
            });
            const data = await response.json();
            if (data.error || !response.ok) {
                setMessage(data.error || "Failed to load sample.");
            } else {
                setMessage(data.message || "Sample loaded!");
                localStorage.removeItem(`reviewMindData_${user.uid}`);
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (error) {
            console.error('Error loading sample:', error);
            setMessage("Error loading sample. Make sure backend is running.");
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
                            <div className="text-xl font-bold text-on-surface text-left">ReviewMind</div>
                            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant text-left">AI Intelligence</div>
                        </div>
                    </div>
                    <nav className="space-y-1 text-left">
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
                    {/* Search bar removed as per requirement */}
                    <div className="flex-1"></div>
                </header>

                <section className="p-12 max-w-6xl mx-auto text-left">
                    <div className="mb-12 text-left">
                        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Knowledge Ingestion</h1>
                        <p className="text-on-surface-variant text-lg">Upload your review datasets to generate high-fidelity AI insights.</p>
                    </div>

                    <div className="grid grid-cols-12 gap-8 text-left">
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
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-4 space-y-6 text-left">
                            <div className="bg-surface-container-low rounded-xl p-8 text-left">
                                <div className="flex items-center justify-between mb-6 text-left">
                                    <h2 className="text-xl font-extrabold tracking-tight text-on-surface">Sample Files</h2>
                                    <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded uppercase">Quick Start</span>
                                </div>
                                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Don't have a dataset ready? Use our curated samples to see the AI analysis in action.</p>
                                <div className="space-y-3">
                                    <div 
                                        onClick={() => handleSampleUpload('smartphone_reviews.txt')}
                                        className="p-4 bg-surface-container-lowest rounded-lg group hover:ring-2 ring-primary/30 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-secondary">smartphone</span>
                                            <div>
                                                <div className="text-sm font-bold text-on-surface">Smartphone Reviews</div>
                                                <div className="text-[10px] text-on-surface-variant">100 reviews • JSON</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div 
                                        onClick={() => handleSampleUpload('laptop_reviews.txt')}
                                        className="p-4 bg-surface-container-lowest rounded-lg group hover:ring-2 ring-primary/30 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-tertiary">laptop_mac</span>
                                            <div>
                                                <div className="text-sm font-bold text-on-surface">Laptop Reviews</div>
                                                <div className="text-[10px] text-on-surface-variant">50 reviews • TXT</div>
                                            </div>
                                        </div>
                                    </div>
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
