import { Link } from 'react-router-dom';

interface FixMateLogoProps {
  inverted?: boolean;
  linkTo?: string;
}

export function FixMateLogo({ inverted = false, linkTo = '/' }: FixMateLogoProps) {
  const content = (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#101B35] dark:bg-[#3867FF] text-white shadow-xs">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="19" r="2" fill="#22D3EE" />
        </svg>
      </span>
      <span
        className={`text-lg font-extrabold tracking-tight ${
          inverted ? 'text-white' : 'text-[#101B35] dark:text-[#F8FAFC]'
        }`}
      >
        Fix<span className="text-[#3867FF] dark:text-[#22D3EE]">Mate</span>
      </span>
    </span>
  );

  if (!linkTo) return content;
  return (
    <Link to={linkTo} className="focus-visible:outline-2 focus-visible:outline-[#3867FF] rounded-lg">
      {content}
    </Link>
  );
}
