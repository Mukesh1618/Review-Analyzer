import React from 'react';

const FunnelLoader = ({ progress = 0, status = "Processing..." }) => {
    let displayStatus = status;
    if (progress >= 10 && status.includes("Initializing")) {
        displayStatus = "Processing...";
    }

    return (
        <div className="flex flex-col items-center justify-center py-20 w-full">
            <div className="relative w-80 h-96 flex flex-col items-center">
                {/* Looping Video */}
                <div className="absolute bottom-[38px] left-1/2 -translate-x-1/2 z-10 w-[640px] flex justify-center items-center pointer-events-none">
                    <video 
                        src="/Loading-screen.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-auto object-contain mix-blend-screen"
                        style={{ filter: "drop-shadow(0 0 15px rgba(34,211,238,0.4))" }}
                    />
                </div>

                {/* Neon Progress Bar */}
                <div className="absolute bottom-[-10px] w-[380px] max-w-[95vw] z-20">
                    <div 
                        className="relative w-full h-12 rounded-full overflow-hidden flex items-center p-[2px]"
                        style={{ 
                            border: "2px solid #22d3ee",
                            backgroundColor: "#050A15",
                            boxShadow: "0 0 20px rgba(34,211,238,0.6), inset 0 0 10px rgba(34,211,238,0.3)"
                        }}
                    >
                        {/* The glowing fill */}
                        <div 
                            className="h-full rounded-full relative overflow-hidden transition-all duration-500 ease-out flex items-center bg-gradient-to-r from-blue-600 to-cyan-400"
                            style={{ width: `${Math.max(progress, 2)}%`, boxShadow: "0 0 25px rgba(34,211,238,1)" }}
                        >
                            {/* Inner particles */}
                            <div className="starry-particles absolute inset-0 w-[200%] h-full mix-blend-overlay opacity-90 animate-[noiseScroll_1s_infinite_linear]"></div>
                            {/* Bright leading edge */}
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-white blur-[3px] rounded-r-full shadow-[0_0_20px_white]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center mt-12 relative z-30">
                <h3 
                    className="text-2xl font-bold text-white mb-2 tracking-widest font-headline-md"
                    style={{ textShadow: "0 0 8px rgba(168,85,247,0.8)" }}
                >
                    {displayStatus}
                </h3>
                <p 
                    className="text-cyan-300 font-extrabold text-sm font-label-md tracking-widest uppercase"
                    style={{ textShadow: "0 0 5px rgba(34,211,238,0.8)" }}
                >
                    {Math.floor(progress)}% Complete
                </p>
            </div>
        </div>
    );
};

export default FunnelLoader;
