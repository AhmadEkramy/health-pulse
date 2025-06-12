import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-500 text-white py-12" id="footer">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-full p-2 group hover:bg-blue-100 transition-all duration-300">
                <Heart 
                  className="w-6 h-6 text-blue-900 group-hover:animate-pulse group-hover:scale-110 transition-transform duration-300" 
                  style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.8))' }}
                />
              </div>
              <h2 className="text-2xl font-bold">Health Pulse</h2>
            </div>
            <p className="text-gray-200">
              Health Pulse is your comprehensive health tracking platform designed to help
              you maintain a healthy lifestyle.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-gray-300 transition-colors duration-300">About</Link></li>
              <li><Link to="/features" className="hover:text-gray-300 transition-colors duration-300">Features</Link></li>
              <li><Link to="/recipes" className="hover:text-gray-300 transition-colors duration-300">Recipes</Link></li>
              <li><Link to="/contact" className="hover:text-gray-300 transition-colors duration-300">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 group">
                <Mail 
                  size={20} 
                  className="text-blue-300 group-hover:animate-pulse group-hover:scale-110 group-hover:text-blue-200 transition-all duration-300" 
                  style={{ filter: 'drop-shadow(0 0 12px rgba(147,197,253,1))' }}
                />
                <a href="mailto:healthpulse2026@gmail.com" className="hover:text-gray-300 transition-colors duration-300">
                  healthpulse2026@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2 group">
                <Phone 
                  size={20} 
                  className="text-blue-300 group-hover:animate-pulse group-hover:scale-110 group-hover:text-blue-200 transition-all duration-300" 
                  style={{ filter: 'drop-shadow(0 0 12px rgba(147,197,253,1))' }}
                />
                <a href="tel:+201094543689" className="hover:text-gray-300 transition-colors duration-300">
                +201094543689
                </a>
              </li>
              <li className="flex items-center gap-2 group">
                <MapPin 
                  size={20} 
                  className="text-blue-300 group-hover:animate-pulse group-hover:scale-110 group-hover:text-blue-200 transition-all duration-300" 
                  style={{ filter: 'drop-shadow(0 0 12px rgba(147,197,253,1))' }}
                />
                <span>Egypt</span>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="group"
                aria-label="Facebook"
              >
                <Facebook 
                  size={24} 
                  className="text-blue-300 group-hover:animate-pulse group-hover:scale-125 group-hover:text-blue-200 transition-all duration-300" 
                  style={{ filter: 'drop-shadow(0 0 15px rgba(147,197,253,1))' }}
                />
              </a>
              <a
                href="#"
                className="group"
                aria-label="Instagram"
              >
                <Instagram 
                  size={24} 
                  className="text-blue-300 group-hover:animate-pulse group-hover:scale-125 group-hover:text-blue-200 transition-all duration-300" 
                  style={{ filter: 'drop-shadow(0 0 15px rgba(147,197,253,1))' }}
                />
              </a>
              <a
                href="#"
                className="group"
                aria-label="LinkedIn"
              >
                <Linkedin 
                  size={24} 
                  className="text-blue-300 group-hover:animate-pulse group-hover:scale-125 group-hover:text-blue-200 transition-all duration-300" 
                  style={{ filter: 'drop-shadow(0 0 15px rgba(147,197,253,1))' }}
                />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200/20 mt-12 pt-8 text-center">
          <p>© 2025 Health Pulse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 