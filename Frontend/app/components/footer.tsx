

'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const Footer = () => {
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const toggleFaq = () => {
    console.log('FAQ toggle clicked, new state:', !isFaqOpen); // Debug log
    setIsFaqOpen(!isFaqOpen);
  };

  return (
    <footer className="bg-blue-200 vw-100 text-blue-800 py-4">
      <div className="container mx-auto px-4">
        {/* Main Content with Quick Links and Social Media */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Quick Links Section */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-2 text-base text-blue-800">Quick Links</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={toggleFaq}
                  className="flex items-center justify-center md:justify-start w-full text-sm hover:text-blue-900 focus:outline-none"
                >
                  <span className="mr-1">{isFaqOpen ? '-' : '+'}</span> FAQ
                </button>
                {isFaqOpen && (
                  <ul className="pl-4 space-y-1 text-sm mt-1">
                    <li>
                      <Link href="/faq" className="hover:text-blue-900 block">
                        How do I reset my password?
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="hover:text-blue-900 block">
                        How can I update my contact information?
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="hover:text-blue-900 block">
                        Where can I view the school calendar?
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="hover:text-blue-900 block">
                        How do I contact support for issues?
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li>
                <Link href="/quicklinks/privacy-policy" className="hover:text-blue-900 text-sm">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/quicklinks/about-us" className="hover:text-blue-900 text-sm">About Us</Link>
              </li>

              <li>
                <Link href="/quicklinks/terms-conditions" className="hover:text-blue-900 text-sm">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Empty column to push Social Media to the right */}
          <div></div>

          {/* Social Media Icons */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-semibold mb-2 text-sm text-blue-800">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/YourPageName"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/facebook.webp" alt="Facebook" width={24} height={24} className="w-6 h-6" />
              </a>
              <a
                href="https://twitter.com/YourHandle"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/X.png" alt="Twitter" width={24} height={24} className="w-6 h-6" />
              </a>
              <a
                href="https://www.instagram.com/YourHandle"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/insta.jpeg" alt="Instagram" width={24} height={24} className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Border and Credits */}
        <div className="border-t border-blue-200 mt-4 pt-2">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-center mb-1">
              <p className="text-xs text-blue-700">
                © {new Date().getFullYear()} Almanet Website
              </p>
              <p className="text-2xs text-blue-800">
                All rights reserved
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;