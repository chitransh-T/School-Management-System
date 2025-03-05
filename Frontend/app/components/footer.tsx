import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4">
        {/* Main Content with Quick Links and Social Media */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Quick Links Section */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-3 text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/FAQ" className="hover:text-gray-400 text-sm">FAQ</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-gray-400 text-sm">Privacy Policy</Link></li>
              <li><Link href="/about-us" className="hover:text-gray-400 text-sm">About Us</Link></li>
              <li><Link href="/contact-us" className="hover:text-gray-400 text-sm">Contact Us</Link></li>
              <li><Link href="/terms-conditions" className="hover:text-gray-400 text-sm">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Empty Spacer - Hidden on mobile, visible on larger screens */}
          <div className="hidden md:block md:col-span-2"></div>

          {/* Social Media Icons */}
          <div className="flex justify-center sm:justify-end">
            <div className="flex space-x-6 sm:space-x-4">
              <a 
                href="https://www.facebook.com/YourPageName" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/facebook.webp" alt="Facebook" width={28} height={28} className="w-7 h-7 sm:w-6 sm:h-6" />
              </a>
              <a 
                href="https://twitter.com/YourHandle" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/X.png" alt="Twitter" width={28} height={28} className="w-7 h-7 sm:w-6 sm:h-6" />
              </a>
              <a 
                href="https://www.instagram.com/YourHandle" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/insta.jpeg" alt="Instagram" width={28} height={28} className="w-7 h-7 sm:w-6 sm:h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Almanet Website. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;