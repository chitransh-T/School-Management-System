export default function VisualizeSuccessSection() {
    return (
      <section className="w-full py-20 bg-gradient-to-br from-sky-100 via-blue-100 to-slate-200 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Visualize Your Success</h2>
            <p className="text-lg text-gray-600">Experience the future of education with dynamic visuals.</p>
          </div>
  
          <div className="relative flex items-center justify-between group transition-all duration-500">
            {/* Moving Shapes */}
            <svg className="absolute w-12 h-12 bg-blue-200 rounded-full opacity-30 shadow-md pointer-events-none animate-orbit-circle" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="50" fill="currentColor" />
            </svg>
            <svg className="absolute w-10 h-10 bg-sky-200 rounded-md opacity-30 shadow-md pointer-events-none animate-orbit-square" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} viewBox="0 0 100 100">
              <rect width="100" height="100" rx="10" fill="currentColor" />
            </svg>
            <svg className="absolute w-14 h-14 bg-gradient-to-r from-blue-200 to-sky-200 opacity-30 shadow-md pointer-events-none animate-orbit-triangle" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} viewBox="0 0 100 100">
              <polygon points="50,10 90,90 10,90" fill="currentColor" />
            </svg>
  
            {/* Left Info - Visible on Hover */}
            <div className="w-1/3 text-left pr-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent shadow-sm mb-2">Why This Project Matters</h3>
              <p className="text-lg font-medium text-gray-600 shadow-sm">
                AlmaNet streamlines admin tasks, empowers teachers, and provides live academic insights for over 10,000+ students.
              </p>
            </div>
  
            {/* Center Image */}
            <div className="relative w-1/3 mx-auto group">
              <div className="absolute -inset-4 bg-gradient-to-r from-sky-300 to-blue-300 opacity-50 blur-xl animate-pulse rounded-xl"></div>
              <img
                src="https://png.pngtree.com/thumb_back/fh260/background/20250226/pngtree-digital-education-icons-and-holographic-interface-in-e-learning-concept-image_16977353.jpg"
                alt="Digital School Management Interface"
                className="relative z-10 w-full max-w-md rounded-xl shadow-2xl transform transition-transform duration-1000 ease-in-out hover:scale-105 animate-float"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                  animation: 'float 6s ease-in-out infinite'
                }}
              />
            </div>
  
            {/* Right Info - Visible on Hover */}
            <div className="w-1/3 text-right pl-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent shadow-sm mb-2">Project Highlights</h3>
              <p className="text-lg font-medium text-gray-600 shadow-sm">
                Advanced modules like student tracking, resource allocation, and automated fee systems showcase full-stack excellence.
              </p>
            </div>
          </div>
  
          {/* Floating and Orbit Animations */}
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0) rotateY(0deg); }
              50% { transform: translateY(-20px) rotateY(10deg); }
            }
            @keyframes orbit-circle {
              0% { transform: translate(-50%, -50%) rotate(0deg) translateX(150px) rotate(0deg); }
              100% { transform: translate(-50%, -50%) rotate(360deg) translateX(150px) rotate(-360deg); }
            }
            @keyframes orbit-square {
              0% { transform: translate(-50%, -50%) rotate(0deg) translateX(180px) rotate(0deg); }
              100% { transform: translate(-50%, -50%) rotate(360deg) translateX(180px) rotate(-360deg); }
            }
            @keyframes orbit-triangle {
              0% { transform: translate(-50%, -50%) rotate(0deg) translateX(210px) rotate(0deg); }
              100% { transform: translate(-50%, -50%) rotate(360deg) translateX(210px) rotate(-360deg); }
            }
            .animate-orbit-circle {
              animation: orbit-circle 10s linear infinite;
            }
            .animate-orbit-square {
              animation: orbit-square 12s linear infinite reverse;
              animation-delay: -2s;
            }
            .animate-orbit-triangle {
              animation: orbit-triangle 14s linear infinite;
              animation-delay: -4s;
            }
          `}</style>
        </div>
      </section>
    );
  }