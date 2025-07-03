import React from 'react';

interface BoltBadgeProps {
  className?: string;
}

const BoltBadge: React.FC<BoltBadgeProps> = ({ className = '' }) => {
  return (
    <div className={`fixed bottom-4 right-4 z-50 group ${className}`}>
      <a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-all duration-300 ease-out hover:scale-105 active:scale-95"
        title="Made with Bolt"
      >
        <div className="relative">
          {/* Glass morphism container */}
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl hover:bg-black/30 hover:border-white/20 transition-all duration-300 hover:shadow-3xl">
            {/* Bolt SVG */}
            <img
              src="/bolt-badge.svg"
              alt="Made with Bolt"
              className="w-12 h-12 opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
          
          {/* Hover tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap border border-white/10">
            Made with Bolt
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
          </div>
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
        </div>
      </a>
    </div>
  );
};

export default BoltBadge; 