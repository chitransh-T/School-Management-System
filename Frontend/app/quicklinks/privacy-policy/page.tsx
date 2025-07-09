'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react'; // Assuming Lucide icons for a clean arrow icon
import { LandingNavbar } from '@/app/components/LandingNavbar';
const PrivacyPolicy = () => {
  const router = useRouter();

  return (
    <div>
      <LandingNavbar/>
      <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 text-gray-800 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
         

          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-700 mb-3">Privacy Policy</h1>
            <p className="text-base text-gray-500">Last updated: June 24, 2025</p>
          </header>

          <div className="bg-white shadow-md rounded-lg p-8 leading-relaxed text-gray-600">
            <p className="mb-6">
              At [Almanet's School Management System], we prioritize the privacy and security of your personal information. This Privacy Policy outlines how we collect, use, disclose, and protect your data when you interact with our school management system. Our commitment is to maintain transparency and comply with applicable data protection laws to ensure your trust in our services.
            </p>
            <p className="mb-6">
              We collect personal information such as names, contact details, student records, and other relevant data provided by schools, administrators, teachers, parents, or students. This information is gathered with your consent or as necessary to fulfill our services, such as managing academic records, facilitating communication, and ensuring compliance with educational regulations. We may also collect usage data to enhance system functionality and user experience.
            </p>
            <p className="mb-6">
              Your data is used solely to support the operations of our school management system, including student administration, attendance tracking, grade management, and communication with stakeholders. We do not sell, rent, or share your personal information with third parties for marketing purposes. Data may be shared with trusted service providers who assist in delivering our services, but only under strict confidentiality agreements and in compliance with applicable laws.
            </p>
            <p className="mb-6">
              To safeguard your information, we employ robust, industry-standard security measures, including encryption, secure access controls, and regular security audits. While we strive to protect your data, no online system can be guaranteed to be completely secure. We continuously monitor and update our practices to mitigate risks and maintain a high level of data protection.
            </p>
            <p className="mb-6">
              You have rights over your personal data, including the ability to access, correct, or request deletion of your information. You may also object to certain data processing activities or request data portability where applicable. To exercise these rights or for any questions regarding your data, please contact our support team at <a href="mailto:support@yourdomain.com" className="text-blue-600 hover:underline">support@yourdomain.com</a>. We will respond promptly in accordance with applicable regulations.
            </p>
            <p className="mb-6">
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. Any updates will be posted on this page with an updated "Last updated" date. We encourage you to review this policy regularly to stay informed about how we protect your information.
            </p>
            <p>
              Thank you for choosing [Almanet's School Management System]. We are dedicated to maintaining the confidentiality, integrity, and security of your personal information while providing a reliable and efficient school management system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;