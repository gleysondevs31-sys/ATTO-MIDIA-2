import React from "react";

interface AttoLogoProps {
  className?: string;
  size?: number;
  showBackground?: boolean;
}

export function AttoLogo({ className = "", size = 36, showBackground = true }: AttoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-300`}
    >
      <defs>
        <linearGradient id="atto-brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" /> {/* hot pink */}
          <stop offset="50%" stopColor="#f97316" /> {/* orange */}
          <stop offset="100%" stopColor="#eab308" /> {/* gold/amber */}
        </linearGradient>
      </defs>
      
      {showBackground && (
        <rect
          width="120"
          height="120"
          rx="32"
          fill="url(#atto-brand-gradient)"
        />
      )}
      
      {/* Downward-Left diagonal download speed-arrow */}
      <g transform={showBackground ? "translate(15, 15) scale(0.75)" : "scale(1.0)"}>
        {/* Main Arrow Body */}
        <path
          d="M 24 96 C 24 96 26 62 26 58 C 26 55 29 53 32 56 L 46 70 L 88 28 C 91 25 96 25 99 28 C 102 31 102 36 99 39 L 57 81 L 71 95 C 74 98 72 101 68 101 C 64 101 24 96 24 96 Z"
          fill="white"
        />
        {/* Speed lines on top-right */}
        <rect
          x="62"
          y="12"
          width="26"
          height="6"
          rx="3"
          transform="rotate(45 62 12)"
          fill="white"
          opacity="0.6"
        />
        <rect
          x="74"
          y="2"
          width="16"
          height="6"
          rx="3"
          transform="rotate(45 74 2)"
          fill="white"
          opacity="0.4"
        />
        {/* Underline speed particles */}
        <rect
          x="32"
          y="108"
          width="40"
          height="6"
          rx="3"
          fill="white"
          opacity="0.8"
        />
        <circle
          cx="82"
          cy="111"
          r="3"
          fill="white"
          opacity="0.6"
        />
        <circle
          cx="92"
          cy="111"
          r="2"
          fill="white"
          opacity="0.4"
        />
      </g>
    </svg>
  );
}
