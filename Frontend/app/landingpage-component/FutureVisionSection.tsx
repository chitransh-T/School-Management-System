
'use client';

import { useState } from 'react';
import { Zap, Users } from 'lucide-react';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default function FutureVisionSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      setResponseMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setResponseMessage(data.message);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      setResponseMessage('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <section
      id="future-vision"
      className="w-full py-16 bg-gradient-to-b from-sky-100 via-blue-130 to-blue-200 text-gray-800 relative overflow-hidden"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left side content remains unchanged */}
          <div className="lg:col-span-2 text-left pr-8">
            <h3 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              The Future of Education is Here
            </h3>
            <p className="text-base lg:text-lg font-semibold opacity-90 mb-8 leading-relaxed">
              Go beyond school management—revolutionize it. AlmaNet equips institutions to shape the future of learning today.
            </p>
            <div className="mb-8">
              <p className="text-base lg:text-lg leading-relaxed text-gray-800">
                If you have any{' '}
                <span className="font-semibold border-b-2 border-gradient-to-r from-blue-600 to-sky-600 bg-blue-100/30 px-1">
                  queries or need assistance
                </span>{' '}
                with the school management, feel free to{' '}
                <span className="font-semibold border-b-2 border-gradient-to-r from-blue-600 to-sky-600 bg-blue-100/30 px-1">
                  reach out to us.
                </span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-8 space-y-4 sm:space-y-0 text-base lg:text-lg">
              <div className="flex items-center">
                <Zap className="w-6 h-6 mr-3 text-yellow-600" />
                <span className="font-semibold">Lightning Fast Performance</span>
              </div>
              <div className="flex items-center">
                <Users className="w-6 h-6 mr-3 text-blue-600" />
                <span className="font-semibold">Trusted Globally</span>
              </div>
            </div>
          </div>

          {/* Right side contact form - Fixed for mobile */}
          <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-blue-100 max-w-sm mx-auto lg:mx-0 relative z-20">
            <h4 className="text-base lg:text-lg font-semibold text-gray-800 mb-4 text-center">Contact Us</h4>
            <div className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300 relative z-30 touch-manipulation"
                style={{ WebkitAppearance: 'none' }}
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300 relative z-30 touch-manipulation"
                style={{ WebkitAppearance: 'none' }}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300 relative z-30 touch-manipulation"
                style={{ WebkitAppearance: 'none' }}
              />
              <textarea
                name="message"
                placeholder="Your message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300 resize-none relative z-30 touch-manipulation"
                style={{ WebkitAppearance: 'none' }}
              ></textarea>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-lg hover:from-blue-700 hover:to-sky-700 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-200 relative z-30 touch-manipulation"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
              {responseMessage && (
                <p className="text-sm text-center text-green-700 mt-2 relative z-30">{responseMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Background decorations - moved to lower z-index */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse z-0"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-pulse delay-1000 z-0"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100 to-pink-100 rounded-full opacity-10 animate-spin-slow z-0"></div>

        <style>{`
          @keyframes spin-slow {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 25s linear infinite;
          }
          .touch-manipulation {
            touch-action: manipulation;
          }
        `}</style>
      </div>
    </section>
  );
}