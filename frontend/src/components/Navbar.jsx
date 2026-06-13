import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Users, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gold/20 py-4 px-6 md:px-12 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-3 group">
        <img 
          src="/logo.png" 
          alt="The Shield Showdown Logo" 
          className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] transition-transform duration-300 group-hover:scale-110"
        />
        <span className="font-gaming font-black text-base md:text-xl tracking-wider text-white transition-colors duration-300">
          THE <span className="text-gold-bright">SHIELD</span> SHOWDOWN
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {isAdmin ? (
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-gaming text-gold border border-gold/30 hover:bg-gold/10 hover:border-gold-bright rounded transition-all duration-300 shadow-gold-glow"
          >
            <Users className="w-4 h-4" />
            Registration
          </Link>
        ) : (
          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-gaming text-black bg-gold-gradient hover:brightness-110 rounded transition-all duration-300 font-bold shadow-gold-glow hover:shadow-gold-glow-btn"
          >
            <LayoutDashboard className="w-4 h-4 text-black" />
            Admin Panel
          </Link>
        )}
      </div>
    </nav>
  );
}
