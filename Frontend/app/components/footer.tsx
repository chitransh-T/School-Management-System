import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        {/* Main Content with Quick Links and Social Media */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Quick Links Section */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-4 text-base">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/FAQ" className="hover:text-gray-400 text-sm">FAQ</Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-gray-400 text-sm">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/about-us" className="hover:text-gray-400 text-sm">About Us</Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-gray-400 text-sm">Contact Us</Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="hover:text-gray-400 text-sm">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Social Media Icons */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-semibold mb-4 text-base">Follow Us</h3>
            <div className="flex space-x-6">
              <a 
                href="https://www.facebook.com/YourPageName" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/facebook.webp" alt="Facebook" width={28} height={28} className="w-7 h-7" />
              </a>
              <a 
                href="https://twitter.com/YourHandle" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/X.png" alt="Twitter" width={28} height={28} className="w-7 h-7" />
              </a>
              <a 
                href="https://www.instagram.com/YourHandle" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-75 transition-opacity"
              >
                <Image src="/insta.jpeg" alt="Instagram" width={28} height={28} className="w-7 h-7" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Border and Credits */}
        <div className="border-t border-gray-700 mt-6 pt-4">
          <div className="flex flex-col items-center  justify-center text-center">
            <div className="text-center mb-2">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} Almanet Website
              </p>
              <p className="text-xs text-gray-500">
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