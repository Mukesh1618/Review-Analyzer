import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Landing_Dark = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "1. Upload Your Data",
      description: "Start by uploading your customer reviews in CSV or JSON format. Our system securely ingests and prepares your data for deep analysis.",
      icon: "cloud_upload",
      color: "primary",
      detail: "8,402 reviews processed",
      progress: 85,
      buttonText: "Go to Upload",
      link: "/upload"
    },
    {
      title: "2. AI Analysis & Insights",
      description: "Our advanced LLMs categorize sentiment, detect key themes, and identify churn risks automatically, turning raw text into actionable intelligence.",
      icon: "analytics",
      color: "tertiary",
      detail: "92% Sentiment Accuracy",
      progress: 92,
      buttonText: "View Dashboard",
      link: "/dashboard"
    },
    {
      title: "3. Chat with your Data",
      description: "Ask natural language questions about your feedback. Get instant answers on top feature requests, UI friction, or competitive advantages.",
      icon: "forum",
      color: "primary",
      detail: "AI-Powered Q&A",
      progress: 100,
      buttonText: "Start Chatting",
      link: "/chat"
    }
  ];

  const nextStep = () => setActiveStep((prev) => (prev + 1) % steps.length);
  const prevStep = () => setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);

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
          <Link to="/login" className="text-on-surface-variant hover:text-primary transition-colors px-3 py-2">Login</Link>
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
            <Link to="/login" className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-fixed-dim transition-all text-center">
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
              <img alt="ReviewMind Dashboard Preview" className="w-full h-auto object-cover" src="/dashboard-preview.png" />
            </div>
          </div>
        </section>

        {/* Sliding Feature Showcase */}
        <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl text-left">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight text-on-surface">Experience the Workflow</h2>
              <p className="text-on-surface-variant">ReviewMind guides you from raw data to deep insights in three simple steps.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={prevStep}
                className="p-3 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all hover:scale-110 active:scale-95 border border-outline-variant/10"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button 
                onClick={nextStep}
                className="p-3 rounded-full bg-primary text-on-primary hover:bg-primary-fixed-dim transition-all hover:scale-110 active:scale-95 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-[500px] overflow-hidden rounded-[3rem] border border-outline-variant/20 bg-surface-container-low p-2 md:p-8">
            <div 
              className="flex transition-transform duration-700 ease-in-out h-full"
              style={{ transform: `translateX(-${activeStep * 100}%)` }}
            >
              {steps.map((step, index) => (
                <div key={index} className="w-full shrink-0 px-4 flex flex-col md:flex-row items-center gap-12 text-left">
                  <div className="flex-1 space-y-8 py-8">
                    <div className={`w-16 h-16 bg-${step.color}-container/30 rounded-2xl flex items-center justify-center border border-${step.color}-container/50`}>
                      <span className={`material-symbols-outlined text-${step.color} text-4xl`}>{step.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-4 text-on-surface">{step.title}</h3>
                      <p className="text-on-surface-variant text-lg leading-relaxed">{step.description}</p>
                    </div>
                    <Link 
                      to={step.link}
                      className={`inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:bg-primary-fixed-dim transition-all shadow-lg shadow-primary/10`}
                    >
                      {step.buttonText}
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </Link>
                  </div>
                  
                  <div className="flex-1 w-full relative">
                    <div className="aspect-[4/3] bg-surface-container-highest rounded-3xl border border-outline-variant/20 shadow-inner overflow-hidden flex flex-col p-8">
                      {index === 0 && (
                        <div className="flex-1 flex flex-col justify-center items-center gap-6 border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/50">
                          <span className="material-symbols-outlined text-6xl text-outline-variant">cloud_upload</span>
                          <div className="text-center">
                            <p className="font-bold text-on-surface">Drop files here</p>
                            <p className="text-xs text-on-surface-variant">CSV, JSON (Max 10MB)</p>
                          </div>
                          <div className="w-48 h-2 bg-surface-container-high rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[85%] transition-all duration-1000"></div>
                          </div>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="flex-1 space-y-6 flex flex-col justify-center">
                          <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">92%</div>
                            <div>
                              <p className="text-xs font-bold text-on-surface">Sentiment Accuracy</p>
                              <p className="text-[10px] text-on-surface-variant">Systems performing optimally</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined text-sm">trending_up</span>
                            </div>
                            <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                              <div className="bg-primary h-full w-[75%] transition-all duration-1000 delay-300"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {index === 2 && (
                        <div className="flex-1 space-y-4 flex flex-col justify-end">
                          <div className="bg-surface-container-low p-4 rounded-xl rounded-bl-none border border-outline-variant/10 self-start max-w-[80%]">
                            <p className="text-xs text-on-surface italic">"What are the top complaints?"</p>
                          </div>
                          <div className="bg-primary-container p-4 rounded-xl rounded-br-none border border-primary/20 self-end max-w-[80%]">
                            <p className="text-xs text-on-primary-container">"Users mention the loading time on the checkout page is too slow."</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Step Indicators */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
                      {steps.map((_, i) => (
                        <div 
                          key={i}
                          className={`h-2 rounded-full transition-all duration-300 ${activeStep === i ? 'w-8 bg-primary' : 'w-2 bg-outline-variant/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
            <Link to="/login" className="bg-primary text-on-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-primary-fixed-dim transition-colors text-center">Get Started Now</Link>
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
