import { Star } from 'lucide-react';
import { testimonials } from '../Landingpage/mainPage';

export default function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 py-20 transition-all duration-700 animate-fade-in-up">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-10 transition-colors duration-500">Trusted by Educators Worldwide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-500 transform hover:scale-105 animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
              <p className="text-gray-600 mb-4 italic transition-opacity duration-500">{testimonial.text}</p>
              <div className="flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-gray-900 font-semibold mt-2">{testimonial.name}</p>
              <p className="text-gray-500">{testimonial.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}