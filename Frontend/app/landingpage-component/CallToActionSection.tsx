import { Users, Calendar, CheckCircle, MessageSquare, ChartBar, Database } from 'lucide-react';

export default function CallToActionSection() {
  return (
    <section className="bg-gradient-to-br from-sky-100 via-blue-50 to-slate-100 py-20 border-t-4 border-blue-200 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">Ready to Transform Your School?</h2>
          <p className="text-lg sm:text-xl mb-8 text-gray-600">Join 10,000+ institutions with our comprehensive management system.</p>
        </div>

        <div className="flex justify-center">
          <div className="max-w-3xl">
            <div className="bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-2xl p-6 hover:from-blue-700 hover:to-sky-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200 group">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold mb-1">1 Year Premium Plan - $100</div>
                <div className="text-xl opacity-90">Complete School Management Solution</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-3 text-blue-200" />
                    <span className="text-sm">Student Management</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-3 text-blue-200" />
                    <span className="text-sm">Schedule & Timetables</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-blue-200" />
                    <span className="text-sm">Attendance Tracking</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-3 text-blue-200" />
                    <span className="text-sm">Parent Communication</span>
                  </div>
                  <div className="flex items-center">
                    <ChartBar className="w-5 h-5 mr-3 text-blue-200" />
                    <span className="text-sm">Analytics & Reports</span>
                  </div>
                  <div className="flex items-center">
                    <Database className="w-5 h-5 mr-3 text-blue-200" />
                    <span className="text-sm">Fee Management</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <div className="text-lg font-semibold group-hover:text-blue-100 transition-colors duration-300">
                  Get Started Today →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-100 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-sky-100 rounded-full opacity-30 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-blue-50 to-sky-50 rounded-full opacity-20 animate-spin-slow"></div>

        {/* Custom Animations */}
        <style>{`
          @keyframes spin-slow {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 30s linear infinite;
          }
        `}</style>
      </div>
    </section>
  );
}