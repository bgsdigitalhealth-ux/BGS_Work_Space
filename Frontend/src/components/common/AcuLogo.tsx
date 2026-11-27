import React from 'react';

interface AcuLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const AcuLogo: React.FC<AcuLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle = 'Workspace',
  className = ''
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl'
  }[size];

  const titleSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Squircle Emblem */}
      <div
        className={`${iconDimensions} bg-gradient-to-br from-[#704fe6] via-[#5a36e6] to-[#3b1fb5] flex items-center justify-center p-1.5 shadow-lg shadow-indigo-950/40 relative shrink-0 ring-1 ring-white/20`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="acuAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#c4b5fd" />
              <stop offset="100%" stop-color="#a78bfa" />
            </linearGradient>
          </defs>
          {/* 'A' Apex */}
          <path
            d="M 50 18 L 70 64 L 59 64 L 54 51 L 46 51 L 41 64 L 30 64 Z M 50 32 L 48 43 L 52 43 Z"
            fill="#ffffff"
          />
          {/* 'C' Curved Swoosh */}
          <path
            d="M 33 42 C 27 46 24 53 25 61 C 27 72 38 78 51 77 C 62 76 71 70 75 63 L 68 58 C 65 63 59 68 51 68 C 42 68 35 63 34 56 C 34 50 37 46 41 43 Z"
            fill="url(#acuAccentGrad)"
            opacity="0.95"
          />
          {/* Core Spark */}
          <circle cx="50" cy="46" r="3.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Wordmark */}
      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`${titleSize} font-black tracking-tight text-white leading-none font-calligraphy text-2xl`}>
              ACU
            </span>
            <span className="text-white font-extrabold tracking-tight text-base leading-none">
              Workspace
            </span>
          </div>
          {subtitle && (
            <p className="text-[10px] tracking-widest uppercase font-semibold text-indigo-300 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
