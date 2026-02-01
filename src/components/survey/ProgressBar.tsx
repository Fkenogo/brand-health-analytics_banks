import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  isHighContrast?: boolean;
  themeColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, isHighContrast, themeColor }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  
  return (
    <div 
      className={`w-full rounded-full h-2.5 mb-6 overflow-hidden ${isHighContrast ? 'bg-gray-900 border border-yellow-400/30' : 'bg-gray-200/10'}`}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${current} of ${total} steps`}
    >
      <div 
        className={`h-2.5 rounded-full transition-all duration-500 ease-out ${isHighContrast ? 'bg-yellow-400' : 'bg-blue-600'}`} 
        style={{ 
          width: `${percentage}%`,
          backgroundColor: themeColor || undefined
        }}
      ></div>
    </div>
  );
};
