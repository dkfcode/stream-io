import React from 'react';

interface BoltBadgeProps {
  className?: string;
}

const BoltBadge: React.FC<BoltBadgeProps> = ({ className = '' }) => {
  return (
    <div className={`fixed bottom-4 right-1 md:bottom-4 md:right-4 z-[60] group ${className}`}>
      <a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-all duration-300 ease-out hover:scale-105 active:scale-95"
        title="Made with Bolt"
      >
        <div className="relative">
          {/* Glass morphism container - responsive sizing */}
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-1 md:rounded-2xl md:p-2 shadow-2xl hover:bg-black/30 hover:border-white/20 transition-all duration-300 hover:shadow-3xl">
            {/* Bolt SVG - responsive sizing */}
            <img
              src="/bolt-badge.svg"
              alt="Made with Bolt"
              className="w-6 h-6 md:w-12 md:h-12 opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
          
          {/* Hover tooltip - responsive sizing */}
          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 md:px-3 md:py-1.5 bg-black/80 backdrop-blur-md text-white text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap border border-white/10">
            Made with Bolt
            <div className="absolute top-full right-3 md:right-4 w-0 h-0 border-l-3 border-r-3 border-t-3 md:border-l-4 md:border-r-4 md:border-t-4 border-transparent border-t-black/80"></div>
          </div>
          
          {/* Subtle glow effect - responsive sizing */}
          <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg md:blur-xl"></div>
        </div>
      </a>
    </div>
  );
};

export default BoltBadge; 