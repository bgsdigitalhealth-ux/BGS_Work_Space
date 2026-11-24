import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'text-indigo-600'
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${color} ${className}`} />
  );
};

export const ButtonSpinner: React.FC<{
  text?: string;
  size?: 'xs' | 'sm';
  className?: string;
}> = ({ text, size = 'sm', className = '' }) => (
  <span className={`inline-flex items-center gap-2 font-medium ${className}`}>
    <LoadingSpinner size={size} color="text-current" />
    {text && <span>{text}</span>}
  </span>
);

export const PageLoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading workspace...'
}) => (
  <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 shadow-xs">
      <LoadingSpinner size="lg" color="text-indigo-600" />
    </div>
    <h3 className="text-sm font-bold text-slate-800">{message}</h3>
    <p className="text-xs text-slate-400 mt-1">Please wait a moment while data is synchronized.</p>
  </div>
);
