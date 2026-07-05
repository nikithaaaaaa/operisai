import React from 'react';

export const CursorOverlay = ({ children, remoteCursors = [] }) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--color-editor-base)]">
      {/* The wrapped Editor Content */}
      <div className="w-full h-full relative z-10">
        {children}
      </div>

      {/* Render Remote Cursors overlay if provided */}
      {remoteCursors.map((cursor, idx) => (
        <div 
          key={cursor.id || idx}
          className="absolute pointer-events-none transition-all duration-300 ease-out z-30"
          style={{ 
            left: `${cursor.x}px`, 
            top: `${cursor.y}px`,
            opacity: cursor.active ? 0.9 : 0
          }}
        >
          {/* Vertical Bar */}
          <div className="w-[2px] h-5" style={{ backgroundColor: cursor.color }} />
          
          {/* Label Tooltip */}
          <div 
            className="absolute top-[-22px] left-0 px-1.5 py-0.5 rounded-t rounded-br whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            <span className="text-white text-[11px] font-bold tracking-wide font-sans leading-none block">
              {cursor.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CursorOverlay;
