import React from 'react';

const ReviewDetail_Dark = () => {
  return (
    <div className="reviewdetail_dark-container">
      
{/* Dashboard Background (Underlay) */}
<div className="fixed inset-0 flex">
{/* SideNavBar */}
<aside className="fixed left-0 top-0 h-full z-40 bg-surface-container-low w-64 border-r border-outline-variant/10">
<div className="p-8">
<div className="flex items-center gap-3 mb-10">
<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
<span className="material-symbols-outlined" >analytics</span>
</div>
<span className="text-xl font-bold text-on-surface">ReviewMind</span>
</div>
<nav className="space-y-2">
<a className="flex items-center gap-3 px-4 py-2 text-primary bg-primary-container/20 rounded-lg transition-colors" href="#">
<span className="material-symbols-outlined">dashboard</span> Dashboard
                    </a>
<a className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
<span className="material-symbols-outlined">cloud_upload</span> Upload
                    </a>
<a className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
<span className="material-symbols-outlined">analytics</span> Analysis
                    </a>
<a className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
<span className="material-symbols-outlined">forum</span> Chat
                    </a>
</nav>
</div>
</aside>
{/* Main Content Area (Blurred) */}
<main className="ml-64 flex-1 p-10 filter blur-sm">
<header className="flex justify-between items-center mb-12">
<div>
<h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Dashboard</h1>
<p className="text-on-surface-variant">Overview of your product intelligence</p>
</div>
</header>
<div className="grid grid-cols-12 gap-8">
<div className="col-span-8 bg-surface-container-lowest p-8 rounded-xl">
<div className="h-64 bg-surface-container-low rounded-lg mb-4"></div>
<div className="h-4 w-3/4 bg-surface-container-low rounded mb-2"></div>
<div className="h-4 w-1/2 bg-surface-container-low rounded"></div>
</div>
<div className="col-span-4 space-y-8">
<div className="bg-surface-container-lowest p-6 rounded-xl h-40"></div>
<div className="bg-surface-container-lowest p-6 rounded-xl h-40"></div>
</div>
</div>
</main>
</div>
{/* Modal Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dim/80 backdrop-blur-sm p-4">
{/* Review Detail Modal */}
<div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden max-h-[921px] flex flex-col border border-outline-variant/20">
{/* Modal Header */}
<div className="px-8 pt-8 pb-4 flex justify-between items-start">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-3">
<span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase tracking-wider rounded-full">Positive</span>
<div className="flex gap-0.5 text-tertiary">
<span className="material-symbols-outlined text-lg" >star</span>
<span className="material-symbols-outlined text-lg" >star</span>
<span className="material-symbols-outlined text-lg" >star</span>
<span className="material-symbols-outlined text-lg" >star</span>
<span className="material-symbols-outlined text-lg" >star_half</span>
</div>
</div>
<h2 className="text-2xl font-extrabold text-on-surface tracking-tight mt-2">Perfect daily companion for developers</h2>
</div>
<button className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant group">
<span className="material-symbols-outlined text-2xl group-active:scale-90 transition-transform">close</span>
</button>
</div>
{/* Modal Content */}
<div className="px-8 pb-10 overflow-y-auto space-y-8">
{/* Review Content */}
<section>
<div className="flex items-center gap-3 mb-4">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/10">
<img alt="User" className="w-full h-full object-cover" data-alt="Portrait of a young professional man with glasses, soft studio lighting, minimalist clean background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIV4kO_XeQfsnPUI0i3IWLNGPlvERW0KL3uI1NwNXWaZ9z9Wu7-hL5DLACJKL86ZDRu_2DnDkC89QCli0rFvpT-ZgXQJ0JTANNQubjAVtAPvkV2dkMCp_BPrNebNdT8aWWxNdq0qYm39tziM6uEwStbpwz6KMJ7vksFjdP56dqKts1IW1kPQHQ80u-bf08zXc5_nWpdJSm-sJW9_IVNrP93TSXaqJ-2WkeIuGd6sjqjqX6qXGBBWjNWIPCTLVlvyFpN_5kNM_fxIjD"/>
</div>
<div>
<p className="text-sm font-semibold text-on-surface">Alex Rivera</p>
<p className="text-xs text-on-surface-variant">Verified Purchase • Oct 14, 2023</p>
</div>
</div>
<div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10">
<p className="text-on-surface-variant leading-relaxed font-body-md">
                            I've been using this for three weeks now and the difference in my workflow is night and day. The integration was seamless, and the AI-driven suggestions are actually helpful rather than intrusive. There's a slight learning curve with the advanced macros, but once you get it, it's incredibly powerful. The build quality of the hardware component feels premium, and the software updates have been consistent. Highly recommend for anyone looking to optimize their deep-work sessions.
                        </p>
</div>
</section>
{/* AI Insights / Key Takeaways */}
<section className="space-y-4">
<div className="flex items-center gap-2 text-primary">
<span className="material-symbols-outlined" >auto_awesome</span>
<h3 className="text-sm font-bold uppercase tracking-widest">AI-Highlighted Takeaways</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{/* Takeaway Card 1 */}
<div className="p-5 bg-surface-container-high rounded-lg border border-outline-variant/10 hover:border-primary-fixed-dim/30 transition-all">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-primary text-xl">bolt</span>
<div className="space-y-1">
<p className="text-sm font-bold text-on-surface">Efficiency Gains</p>
<p className="text-xs text-on-surface-variant leading-normal">User reports immediate improvement in daily workflow speed.</p>
</div>
</div>
</div>
{/* Takeaway Card 2 */}
<div className="p-5 bg-surface-container-high rounded-lg border border-outline-variant/10 hover:border-primary-fixed-dim/30 transition-all">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-primary text-xl">extension</span>
<div className="space-y-1">
<p className="text-sm font-bold text-on-surface">Seamless Integration</p>
<p className="text-xs text-on-surface-variant leading-normal">Setup process noted as smooth and intuitive for technical users.</p>
</div>
</div>
</div>
{/* Takeaway Card 3 */}
<div className="p-5 bg-surface-container-high rounded-lg border border-outline-variant/10 hover:border-primary-fixed-dim/30 transition-all">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-primary text-xl">school</span>
<div className="space-y-1">
<p className="text-sm font-bold text-on-surface">Learning Curve</p>
<p className="text-xs text-on-surface-variant leading-normal">Advanced features require time to master but offer high utility.</p>
</div>
</div>
</div>
{/* Takeaway Card 4 */}
<div className="p-5 bg-surface-container-high rounded-lg border border-outline-variant/10 hover:border-primary-fixed-dim/30 transition-all">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
<div className="space-y-1">
<p className="text-sm font-bold text-on-surface">Build Quality</p>
<p className="text-xs text-on-surface-variant leading-normal">Hardware components described as having a "premium feel".</p>
</div>
</div>
</div>
</div>
</section>
</div>
{/* Modal Footer Actions */}
<div className="px-8 py-6 bg-surface-container-low border-t border-outline-variant/10 flex justify-end items-center gap-4">
<button className="px-6 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
                    Flag Review
                </button>
<button className="px-8 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-lg shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]">
                    Add to Analysis Repo
                </button>
</div>
</div>
</div>

    </div>
  );
};

export default ReviewDetail_Dark;
