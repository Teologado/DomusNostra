import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/30 backdrop-blur-md border border-white/20 shadow-lg rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;