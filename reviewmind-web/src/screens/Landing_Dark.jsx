import React from 'react';
import { Link } from 'react-router-dom';

const Landing_Dark = () => {
  return (
    <div className="bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen">

      {/* TopNavBar */}
      <nav className="w-full h-16 sticky top-0 flex justify-between items-center px-8 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 font-manrope text-sm">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold text-on-surface tracking-tight">ReviewMind</span>
          <div className="hidden md:flex gap-6 items-center">
            <a className="text-primary font-semibold transition-colors" href="#">Home</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Features</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Pricing</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center bg-surface-container-low rounded-full px-3 py-1.5 gap-2">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-xs w-32 placeholder:text-outline-variant text-on-surface" placeholder="Search insights..." type="text" />
          </div>
          <Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors px-3 py-2">Login</Link>
        </div>
      </nav>

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-6 lg:px-12 text-center max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-container/20 text-tertiary rounded-full text-xs font-semibold mb-8 border border-tertiary-container/30">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span>Powered by Advanced LLMs</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-8">
            Turn customer reviews into <br />
            <span className="text-primary">AI-powered insights</span>
          </h1>
          <p className="text-lg lg:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            Unlock the hidden narrative in your user feedback. ReviewMind categorizes sentiment, detects trends, and answers your toughest product questions in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/upload" className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-fixed-dim transition-all text-center">
              Get Started Free
            </Link>
            <button className="w-full sm:w-auto bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-bold border border-outline-variant/30 hover:bg-surface-container-high transition-colors">
              View Demo
            </button>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-3xl -z-10 transform translate-y-12"></div>
            <div className="bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/20">
              <img alt="ReviewMind Dashboard Preview" className="w-full h-auto object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMUChw1VHgdG6KtP2JGZ0mmYgA9Vxc0z372lqXMXiQTjei6otANcoNB7dOw_5hRcPUQLW6sAIkDquRBqzy7X3rN4HNoKLcvee_VpdPoPlQEMPoxH7cYZP-Jqt6BwTbG-ctfh_u27LWPa4IvXQXFdulZwMSDfwLDCAOnzUixcTXjbKcgvsiW38xtNtBtqyvtuMk6d3ag13TB0awaS_H82ASMQ76El8c0y4Gn6Xg_8VkGdgmbJynd1X2t8kfujlgrU0ODVlAEO1taw7O" />
              <div className="absolute bottom-8 left-8 right-8 glass-effect bg-surface-container-highest/60 p-6 rounded-xl border border-outline-variant/20 flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Live Analysis</p>
                    <p className="font-bold text-on-surface">"Sentiment is up 14% this quarter"</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-surface-container-highest bg-surface-container-low"></div>
                    <div className="w-10 h-10 rounded-full border-2 border-surface-container-highest bg-surface-container-high"></div>
                    <div className="w-10 h-10 rounded-full border-2 border-surface-container-highest bg-primary/40 flex items-center justify-center text-[10px] font-bold text-on-primary-container">+24</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl text-left">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight text-on-surface">Curation at the core of your growth</h2>
              <p className="text-on-surface-variant">We built ReviewMind to be more than a tool—it's your dedicated analyst that never sleeps.</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button className="p-2 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Feature */}
            <div className="md:col-span-2 bg-surface-container-low rounded-[2rem] p-10 flex flex-col justify-between min-h-[400px] border border-outline-variant/10 text-left">
              <div>
                <div className="w-14 h-14 bg-surface-container-highest rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-on-surface">File Upload (CSV, JSON)</h3>
                <p className="text-on-surface-variant max-w-sm mb-8">Bring your data from anywhere. We support seamless ingestion from App Store, Play Store, Trustpilot, and custom datasets.</p>
              </div>
              <div className="bg-surface-container-highest rounded-xl p-4 border border-outline-variant/20 shadow-sm flex items-center gap-4">
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
                <div className="flex-1 h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[85%]"></div>
                </div>
                <span className="text-xs font-bold text-on-surface-variant">8,402 reviews processed</span>
              </div>
            </div>

            {/* Small Feature 1 */}
            <div className="bg-primary-container text-on-primary-container rounded-[2rem] p-10 flex flex-col justify-between border border-primary/20 text-left">
              <div>
                <h3 className="text-2xl font-bold mb-4">Sentiment Analysis</h3>
                <p className="text-on-primary-container/80 mb-8">Beyond positive/negative. Our AI detects frustration, delight, and indifference with 98% accuracy.</p>
              </div>
              <div className="flex justify-center items-center py-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 border-8 border-on-primary-container/20 rounded-full"></div>
                  <div className="absolute inset-0 border-8 border-on-primary-container border-t-transparent rounded-full rotate-45"></div>
                  <span className="text-2xl font-bold">92%</span>
                </div>
              </div>
            </div>

            {/* Small Feature 2 */}
            <div className="bg-surface-container-highest rounded-[2rem] p-10 flex flex-col justify-between border border-outline-variant/20 text-left">
              <div>
                <div className="w-14 h-14 bg-surface-container-low rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-tertiary text-3xl">forum</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-on-surface">Chat with your Data</h3>
                <p className="text-on-surface-variant mb-6">Ask natural language questions like "What are people saying about the new UI update?"</p>
              </div>
              <div className="space-y-3">
                <div className="bg-surface-container-low p-3 rounded-lg text-xs italic text-on-surface-variant ml-4 border border-outline-variant/20">
                  "What is the top feature request?"
                </div>
                <div className="bg-primary-container p-3 rounded-lg text-xs font-medium text-on-primary-container mr-4 border border-primary/20">
                  "Users are requesting Dark Mode most frequently."
                </div>
              </div>
            </div>

            {/* Medium Feature */}
            <div className="md:col-span-2 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/20 p-10 flex flex-col md:flex-row gap-10 items-center overflow-hidden text-left">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 text-on-surface">AI-generated Insights</h3>
                <p className="text-on-surface-variant">Automated executive summaries that distill thousands of reviews into actionable bullet points for your product roadmap.</p>
                <ul className="mt-6 space-y-4">
                  <li className="flex gap-3 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                    <span>Identify churn risks before they happen</span>
                  </li>
                  <li className="flex gap-3 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
                    <span>Track competitive advantage over time</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="w-full aspect-video bg-surface-container-low rounded-xl flex items-center justify-center p-4 border border-outline-variant/10">
                  <img alt="Insight Visualization" className="w-full h-full object-cover rounded-lg opacity-30" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcnGvi1P1mUKZqcMDwSXaxO8nLHXI_FyCN0PEi3W3B5v0DbPGR4fjpjnU7nZoiT-Ky7PLD_bcqCpnhqgSHpbDVLxHhQ-5xqu-3g_Q8Cl-EL8Ihaz9JHjohwW-ncoJuqEHR56D7hlodyEVtvU01lugvP7rBwC7itRXF5O9WF2ULQOCJRTTYN3oh7q_XN_FDi06AcZTVJ28hat8cqdfeaBeuyslxH6JQF-Nr6v411d_mh2rOHEBzjEfg5cEafbMZ6WQdzFleQ32jhem1" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-highest p-4 rounded-xl shadow-xl flex gap-3 items-center border border-outline-variant/20">
                    <div className="w-2 h-10 bg-primary rounded-full"></div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase">Trend Alert</p>
                      <p className="text-sm font-bold text-on-surface">New integration requests +22%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Signature "Insight Cloud" Component */}
        <section className="py-24 bg-surface-container-low border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-left">
            <div>
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-8 tracking-tighter leading-tight text-on-surface">Complex data, <br /><span className="text-primary">Curated for clarity.</span></h2>
              <div className="space-y-6">
                <div className="p-6 bg-surface-container-lowest rounded-2xl flex gap-5 shadow-sm border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-on-surface">Deep Learning Core</h4>
                    <p className="text-on-surface-variant text-sm">Our neural network is trained specifically on customer feedback datasets for hyper-accurate context recognition.</p>
                  </div>
                </div>
                <div className="p-6 bg-surface-container-lowest rounded-2xl flex gap-5 shadow-sm border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-3xl">speed</span>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-on-surface">Real-time Processing</h4>
                    <p className="text-on-surface-variant text-sm">Upload 10,000 reviews and get a full analysis report in under 45 seconds.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Glassmorphism Insight Cloud */}
              <div className="aspect-square rounded-full bg-primary/10 absolute -top-10 -right-10 w-64 h-64 blur-3xl -z-10"></div>
              <div className="aspect-square rounded-full bg-tertiary/10 absolute -bottom-10 -left-10 w-64 h-64 blur-3xl -z-10"></div>
              <div className="glass-effect bg-surface-container-highest/40 p-10 rounded-[3rem] border border-outline-variant/20 shadow-2xl relative">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-black uppercase tracking-widest text-primary">Intelligence Report</span>
                  <span className="material-symbols-outlined text-outline">more_horiz</span>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                    <div className="bg-surface-container-high/60 p-4 rounded-xl rounded-tl-none flex-1 border border-outline-variant/10">
                      <p className="text-sm font-medium text-on-surface">Summarize the main friction point in the mobile app.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant/30">
                      <span className="material-symbols-outlined text-on-surface text-sm">smart_toy</span>
                    </div>
                    <div className="bg-primary-container p-5 rounded-xl rounded-tl-none flex-1 border border-primary/20">
                      <p className="text-sm leading-relaxed text-on-primary-container">Based on 452 recent reviews, the primary friction point is the <strong>Checkout Latency</strong> on iOS. 68% of users mention it feels "sluggish" compared to desktop.</p>
                      <div className="mt-4 flex gap-2">
                        <span className="px-2 py-1 bg-on-primary-container/10 rounded text-[10px] font-bold text-on-primary-container">iOS Performance</span>
                        <span className="px-2 py-1 bg-on-primary-container/10 rounded text-[10px] font-bold text-on-primary-container">UX Friction</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-8 tracking-tight text-on-surface">Stop guessing. <br /><span className="text-primary">Start knowing.</span></h2>
          <p className="text-on-surface-variant text-lg mb-12">Join 500+ teams using ReviewMind to build products people actually love.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/upload" className="bg-primary text-on-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-primary-fixed-dim transition-colors text-center">Get Started Now</Link>
            <button className="w-full sm:w-auto bg-surface-container-high text-on-surface px-10 py-5 rounded-xl font-bold text-lg border border-outline-variant/30 hover:bg-surface-container-highest transition-colors">Talk to Sales</button>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-lowest py-20 border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-left">
          <div className="col-span-2 md:col-span-1">
            <span className="text-2xl font-bold text-on-surface tracking-tight mb-6 block">ReviewMind</span>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">
              Next-generation customer intelligence for product-led growth teams.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-on-surface mb-6">Product</h5>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Features</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Integrations</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Pricing</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-on-surface mb-6">Company</h5>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">About</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-on-surface mb-6">Legal</h5>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-20 pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-on-surface-variant/40 font-medium">
          <p>© 2024 ReviewMind AI. All rights reserved.</p>
          <div className="flex gap-8">
            <a className="hover:text-on-surface transition-colors" href="#">Twitter</a>
            <a className="hover:text-on-surface transition-colors" href="#">LinkedIn</a>
            <a className="hover:text-on-surface transition-colors" href="#">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing_Dark;
