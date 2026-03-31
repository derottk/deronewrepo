import React from 'react';
import { cn } from '../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 shadow-xl",
      className
    )}>
      {children}
    </div>
  );
};
