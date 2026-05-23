import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { logout } from '../firebase';

const ProfileDropdown = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            setIsOpen(false);
            navigate('/');
        } catch (err) {
            console.error("Sign out failed:", err);
        }
    };

    if (!user) {
        return (
            <Link 
                to="/login" 
                className="px-5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-bold transition-all flex items-center gap-2 scale-95 active:scale-100"
            >
                <span className="material-symbols-outlined text-sm">login</span>
                Login
            </Link>
        );
    }

    const email = user.email || "user@reviewmind.ai";
    const displayName = user.displayName || user.providerData?.[0]?.displayName || email.split('@')[0];
    const initial = email[0].toUpperCase();
    const photoURL = user.photoURL || user.providerData?.[0]?.photoURL;

    return (
        <div className="relative font-manrope">
            {/* Avatar Trigger Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 focus:outline-none transition-transform hover:scale-105 active:scale-95 group"
            >
                {photoURL ? (
                    <img 
                        src={photoURL} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full border-2 border-outline-variant/30 object-cover shadow-lg group-hover:border-primary/50 transition-colors"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#2e3138] to-[#1a1c20] border-2 border-outline-variant/30 flex items-center justify-center shadow-lg group-hover:border-primary/50 transition-colors relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none"></div>
                        <span className="text-sm font-black text-on-surface/90 uppercase tracking-wider font-display">{initial}</span>
                    </div>
                )}
            </button>

            {/* Backdrop to close dropdown on click outside */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Dropdown Card */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-surface-container-highest border border-outline-variant/20 rounded-2xl shadow-2xl z-50 py-3 text-left font-manrope animate-fade-in origin-top-right transform scale-100">
                    {/* User Metadata */}
                    <div className="px-5 py-3 border-b border-outline-variant/10 mb-2">
                        <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold opacity-60">Signed In As</p>
                        <p className="text-sm font-extrabold text-on-surface mt-1 truncate">{displayName}</p>
                        <p className="text-[11px] text-on-surface-variant/70 truncate">{email}</p>
                    </div>

                    {/* Navigation Options */}
                    <Link 
                        to="/"
                        onClick={() => setIsOpen(false)}
                        className="w-full px-5 py-2.5 flex items-center gap-3 text-sm text-on-surface-variant hover:text-on-surface hover:bg-primary/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">home</span>
                        Go to Landing Page
                    </Link>

                    <Link 
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="w-full px-5 py-2.5 flex items-center gap-3 text-sm text-on-surface-variant hover:text-on-surface hover:bg-primary/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">dashboard</span>
                        View Dashboard
                    </Link>

                    {/* Logout Option */}
                    <div className="border-t border-outline-variant/10 mt-2 pt-2 px-2">
                        <button
                            onClick={handleLogout}
                            className="w-full px-3 py-2 flex items-center gap-3 text-sm text-error hover:bg-error-container/20 rounded-lg transition-colors font-semibold"
                        >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
