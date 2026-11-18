import { useState } from 'react';
import { Wrench } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeImage({ src, alt, className = '', fallbackLabel }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#101B35]/10 via-[#3867FF]/10 to-[#22D3EE]/10 dark:from-[#151E30] dark:to-[#101B35] text-[#68758A] dark:text-slate-400 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Wrench className="w-7 h-7 text-[#3867FF] mb-1.5" />
        {fallbackLabel && <span className="text-xs font-medium px-3 text-center truncate max-w-full">{fallbackLabel}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
