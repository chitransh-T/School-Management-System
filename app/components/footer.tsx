import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4">
        {/* Main Content with Quick Links and Social Media */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Quick Links Section */}
          <div>
            <ul className="space-y-1">
            <li><Link href="/FAQ" className="hover:text-gray-400 text-sm">FAQ</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-gray-400 text-sm">Privacy Policy</Link></li>
              <li><Link href="/about-us" className="hover:text-gray-400 text-sm">About Us</Link></li>
              <li><Link href="/contact-us" className="hover:text-gray-400 text-sm">Contact Us</Link></li>
              <li><Link href="/terms-conditions" className="hover:text-gray-400 text-sm">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Empty Spacer to Push Social Media Logos to the Right */}
          <div className="md:col-span-2"></div>

          {/* Social Media Icons */}
          <div className="flex justify-end">
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/YourPageName" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/facebook.webp" alt="Facebook" width={24} height={24} />
              </a>
              <a 
                href="https://twitter.com/YourHandle" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/X.png" alt="Twitter" width={24} height={24} />
              </a>
              <a 
                href="https://www.instagram.com/YourHandle" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/insta.jpeg" alt="Instagram" width={24} height={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Almanet Website. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;