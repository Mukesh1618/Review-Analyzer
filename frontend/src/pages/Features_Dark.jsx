import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import { useAuth } from '../AuthContext';

const Features_Dark = () => {
  const { user } = useAuth();
  
  const [visibleSections, setVisibleSections] = useState({});
  const sectionRefs = useRef([]);

  const features = [
    {
      id: "upload",
      title: "Knowledge Ingestion",
      description: "Upload your data from any marketplace in CSV, JSON, or TXT. Our AI Gatekeeper validates the structure and ensures your insights are derived from clean data.",
      image: "/upload-preview.png",
      imageAlt: "Upload Screen",
      align: "left", 
    },
    {
      id: "dashboard-1",
      title: "Data Analyzed",
      description: "Instantly get sentiment trends and overall distributions. See exactly how the market is reacting to your product over time.",
      image: "/dashboard-preview-1.png",
      imageAlt: "Dashboard Overview",
      align: "right", 
    },
    {
      id: "dashboard-2",
      title: "Quick Summary",
      description: "View core strengths, weaknesses, and sample raw reviews to quickly identify the most pressing market feedback at a glance.",
      image: "/dashboard-preview-2.png",
      imageAlt: "Dashboard Details",
      align: "left",
    },
    {
      id: "analysis-1",
      title: "Deep Product Summary",
      description: "A comprehensive AI-driven synthesis of the entire product. Discover the overarching themes driving customer satisfaction or frustration.",
      image: "/deep-analysis-preview-1.png",
      imageAlt: "Deep Summary",
      align: "right",
    },
    {
      id: "analysis-2",
      title: "Aspect Mapping",
      description: "Maps the different product features customers liked and disliked, detailing specific pros and cons for individual hardware and software components.",
      image: "/deep-analysis-preview-2.png",
      imageAlt: "Aspect Mapping",
      align: "left",
    },
    {
      id: "analysis-3",
      title: "Authenticity Report",
      description: "Reviews are deeply analyzed and scam or fake reviews are completely discarded from the analysis, ensuring your data is 100% genuine.",
      image: "/deep-analysis-preview-3.png",
      imageAlt: "Authenticity Report",
      align: "right",
    },
    {
      id: "chat",
      title: "Semantic Q&A",
      description: "Chat directly with your review data. Ask complex natural language questions and get immediate, cited answers directly from the market.",
      image: "/chat-preview.png",
      imageAlt: "Chat Engine",
      align: "left",
    }
  ];

  // Set up IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.3 // Trigger when 30% of the section is visible
    };

    const observerCallback = (entries) => {
      setVisibleSections(prev => {
        const next = { ...prev };
        entries.forEach(entry => {
          // If it is intersecting, set it to true. Once true, you can optionally leave it true to prevent re-animating, 
          // but alternating in and out is what the user wants on scroll.
          next[entry.target.dataset.index] = entry.isIntersecting;
        });
        return next;
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="text-on-background min-h-screen font-manrope selection:bg-primary-container selection:text-on-primary-container relative">
      
      {/* Background Layer */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: 'url(/background.jpg)' }}
      />
      {/* Semi-transparent overlay to ensure text is readable but background is visible enough */}
      <div className="fixed inset-0 w-full h-full z-10 bg-[#10131a]/50" />

      {/* Content Wrapper */}
      <div className="relative z-20">

      {/* Navbar */}
      <nav className="w-full h-16 sticky top-0 flex justify-between items-center px-8 z-50 bg-surface/40 backdrop-blur-lg border-b border-outline-variant/20">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-lg font-bold text-on-surface tracking-tight">ReviewMind</Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link className="text-on-surface-variant hover:text-primary transition-colors" to="/">Home</Link>
            <Link className="text-primary font-semibold transition-colors" to="/features">Features</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ProfileDropdown />
        </div>
      </nav>

      {/* Hero Header */}
      <header className="pt-32 pb-24 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl lg:text-7xl font-extrabold text-on-surface tracking-tight mb-6 leading-tight">
          Every tool you need to <br /><span className="text-primary">perfect your product.</span>
        </h1>
        <p className="text-xl text-on-surface-variant leading-relaxed font-medium">
          Explore the full suite of ReviewMind features designed to help you extract deep market intelligence from raw customer reviews.
        </p>
      </header>

      {/* Zigzag Features Layout */}
      <main className="max-w-7xl mx-auto px-6 pb-32 space-y-40">
        {features.map((feature, index) => {
          const isVisible = visibleSections[index];
          const isLeft = feature.align === "left";
          
          return (
            <div 
              key={feature.id}
              data-index={index}
              ref={el => sectionRefs.current[index] = el}
              className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* Image Column */}
              <div 
                className={`w-full lg:w-3/5 ${!isLeft ? 'lg:order-2' : ''} perspective-[2000px]`}
              >
                <div 
                  className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isVisible 
                      ? 'transform translate-x-0 scale-100 opacity-100' 
                      : isLeft 
                        ? 'transform -translate-x-[20%] scale-75 opacity-0' 
                        : 'transform translate-x-[20%] scale-75 opacity-0'
                  }`}
                >
                  <div 
                    className="bg-surface-container-low/40 p-3 rounded-[2rem] border border-outline-variant/30 shadow-2xl backdrop-blur-sm"
                    style={{ animation: isVisible ? `float ${6 + (index % 3)}s ease-in-out infinite alternate` : 'none' }}
                  >
                    <img 
                      src={feature.image} 
                      alt={feature.imageAlt} 
                      className="w-full rounded-2xl border border-outline-variant/20 shadow-inner" 
                    />
                  </div>
                </div>
              </div>

              {/* Text Column */}
              <div 
                className={`w-full lg:w-2/5 space-y-6 transition-all duration-[1200ms] delay-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isVisible 
                    ? 'transform translate-y-0 opacity-100' 
                    : 'transform translate-y-12 opacity-0'
                }`}
              >
                <h2 className="text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
                  {feature.title}
                </h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  {feature.description}
                </p>
                <div className="w-12 h-1 bg-primary rounded-full opacity-50 mt-8"></div>
              </div>

            </div>
          );
        })}
      </main>

      {/* Bottom CTA */}
      <section className="py-32 text-center border-t border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-md relative z-10">
         <h2 className="text-4xl font-extrabold mb-8 tracking-tight text-on-surface">Ready to perfect your product?</h2>
         <Link to={user ? "/dashboard" : "/login"} className="inline-block bg-primary text-on-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-primary-fixed-dim transition-colors shadow-[0_0_40px_rgba(var(--primary),0.3)]">
           Get Started Now
         </Link>
      </section>
      
      <footer className="bg-surface-container-lowest py-12 border-t border-outline-variant/20 text-center text-on-surface-variant text-sm relative z-10">
        <p>© 2024 ReviewMind AI. All rights reserved.</p>
      </footer>
      
      {/* Global CSS for the levitation floating effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(0.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}} />
      </div>
    </div>
  );
};

export default Features_Dark;
