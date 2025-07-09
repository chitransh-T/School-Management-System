'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react'; // Assuming Lucide icons for a clean arrow icon
import { LandingNavbar } from '@/app/components/LandingNavbar';
const TermsAndConditions = () => {
  const router = useRouter();

  return (
    <div >
    <LandingNavbar/>
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 text-gray-800 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        

        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-700 mb-3">Terms and Conditions</h1>
          <p className="text-base text-gray-500">Last updated: June 24, 2025</p>
        </header>

        <div className="bg-white shadow-md rounded-lg p-8 leading-relaxed text-gray-600">
          <p className="mb-6">
            Welcome to [Almanet's School Management System]. By accessing or using our school management system (the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). These Terms govern your use of the Service and form a legally binding agreement between you and [Almanet's School Management System]. If you do not agree with these Terms, you must refrain from using the Service.
          </p>
          <p className="mb-6">
            [Almanet's School Management System] grants you a limited, non-exclusive, non-transferable, and revocable license to use the Service for the purpose of managing school operations, including but not limited to student records, attendance, grading, and communication with stakeholders. You may not modify, reverse-engineer, copy, distribute, or create derivative works of the Service, nor may you attempt to access its source code or underlying technology except as expressly permitted by [Almanet's School Management System].
          </p>
          <p className="mb-6">
            As a user, you are responsible for maintaining the confidentiality of your account credentials and ensuring the accuracy of all information provided through the Service. Any misuse of the Service, including unauthorized access, impersonation, or providing false information, may result in immediate suspension or termination of your account. You agree to use the Service in compliance with all applicable laws and regulations and to refrain from engaging in any activity that could harm the Service or its users.
          </p>
          <p className="mb-6">
            We are committed to protecting your data in accordance with our <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a> and applicable data protection laws. Your data is collected and processed to deliver and improve the Service, ensure compliance with educational regulations, and enhance user experience. We do not sell or rent your data to third parties for marketing purposes. However, we may disclose your information to trusted service providers under strict confidentiality agreements or as required by law enforcement or regulatory authorities.
          </p>
          <p className="mb-6">
            [Almanet's School Management System] reserves the right to suspend or terminate your access to the Service at any time, with or without notice, if you violate these Terms or engage in activities that harm the Service or its users. Upon termination, your account data may be retained for a period of 30 days before deletion, unless otherwise required by law. You acknowledge that [Almanet's School Management System] is not liable for any loss of data resulting from such termination.
          </p>
          <p className="mb-6">
            We may update these Terms periodically to reflect changes in our practices or legal requirements. Any updates will be posted on this page with an updated "Last updated" date. Your continued use of the Service after such changes constitutes your acceptance of the revised Terms. If you have any questions or concerns about these Terms, please contact us at <a href="mailto:support@yourdomain.com" className="text-blue-600 hover:underline">support@yourdomain.com</a>.
          </p>
          <p>
            Thank you for using [Almanet's School Management System]. We are dedicated to providing a reliable and secure platform to support your school management needs while upholding the highest standards of integrity and compliance.
          </p>
        </div>
      </div>

    </div>
    </div>
  );
};

export default TermsAndConditions;