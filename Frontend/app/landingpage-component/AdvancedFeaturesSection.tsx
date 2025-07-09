import { imageBasedFeatures, ImageFeatureCard } from '../Landingpage/mainPage';

export default function AdvancedFeaturesSection() {
  return (
    <section className="w-full py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 relative overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
            Our Advanced School Management Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover how our cutting-edge technology transforms traditional education management into a seamless digital experience
          </p>
        </div>
        {/* Image-Based Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {imageBasedFeatures.map((feature, index) => (
            <div
              key={index}
              className="animate-fade-in-up opacity-0"
              style={{
                animationDelay: `${index * 200}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <ImageFeatureCard {...feature} />
            </div>
          ))}
        </div>

        {/* Statistics Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-blue-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">10,000+</div>
              <div className="text-gray-600 text-sm">Active Students</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">2,500+</div>
              <div className="text-gray-600 text-sm">Digital Classrooms</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">15,000+</div>
              <div className="text-gray-600 text-sm">Teachers</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-600">500+</div>
              <div className="text-gray-600 text-sm">Schools Managed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-sky-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100 to-sky-100 rounded-full opacity-10 animate-spin-slow"></div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </section>
  );
}