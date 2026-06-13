import React from 'react';
import { Shield, Instagram, Youtube, MessageSquare } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gold/10 py-8 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-gold" />
          <span className="font-gaming font-bold text-sm tracking-widest text-gold-bright">
            THE SHIELD SHOWDOWN
          </span>
        </div>

        <p className="text-gray-500 text-xs font-sans text-center md:text-left">
          &copy; {new Date().getFullYear()} The Shield Showdown. All Rights Reserved. Glory Awaits the Brave.
        </p>

        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-200">
            <Youtube className="w-5 h-5" />
          </a>
          <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-200">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-200">
            <MessageSquare className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
