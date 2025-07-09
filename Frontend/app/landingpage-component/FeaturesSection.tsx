import { CheckCircle, Users, Calendar, ChartBar, FileText, Shield } from 'lucide-react';
import { features, FeatureCard } from '../Landingpage/mainPage';

export default function FeaturesSection() {
  return (
    <>
      <svg className="wave-divider" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#e0f7fa" d="M0,0 C480,60 960,0 1440,60 L1440,60 L0,60 Z" />
      </svg>
      <section className="w-full py-20 bg-gray-50 transition-all duration-700 opacity-100">
        <div className="container mx-auto px-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16 transition-all duration-700 ease-in-out opacity-100">
            Comprehensive School Management Solutions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-card card-3d-hover animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <FeatureCard
                  {...feature}
                  icon={index === 0 ? Users : index === 1 ? CheckCircle : index === 2 ? Calendar : index === 3 ? ChartBar : index === 4 ? FileText : Shield}
                  iconClassName={index % 2 === 0 ? 'icon-bounce' : 'icon-pulse'}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}