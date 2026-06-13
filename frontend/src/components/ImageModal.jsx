import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

export default function ImageModal({ src, title, isOpen, onClose }) {
  if (!isOpen) return null;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = title ? `${title.replace(/\s+/g, '-').toLowerCase()}-proof.png` : 'download-proof.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback behavior if fetch fails
      window.open(src, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      {/* Overlay Close clicks */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-dark-card border border-gold/20 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center bg-black/50 border-b border-gold/15 px-6 py-4 z-10">
          <span className="font-gaming font-bold text-sm text-gold-bright tracking-wider uppercase">
            {title || 'Screenshot Proof'}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap justify-center items-center gap-3 bg-black/30 border-b border-gold/10 py-2.5 px-6 z-10 text-xs">
          <button
            onClick={handleZoomIn}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded transition-all cursor-pointer font-medium"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" /> Zoom In
          </button>
          <button
            onClick={handleZoomOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded transition-all cursor-pointer font-medium"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" /> Zoom Out
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded transition-all cursor-pointer font-medium"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-gradient text-black hover:brightness-110 font-gaming font-bold rounded transition-all cursor-pointer"
            title="Download Image"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>

        {/* Viewport */}
        <div
          className="flex-grow overflow-hidden flex items-center justify-center p-6 bg-black relative cursor-grab active:cursor-grabbing min-h-[400px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={src}
            alt={title}
            className="max-w-full max-h-[55vh] object-contain select-none transition-transform duration-75 pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
