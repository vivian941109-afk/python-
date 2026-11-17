import React from 'react';

interface TopNavProps {
  completedCount: number;
  totalChallenges: number;
}

export const TopNav: React.FC<TopNavProps> = ({ completedCount, totalChallenges }) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#hero-forge"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('hero-forge');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 rounded"
        >
          Python 物件實驗室
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="主導覽列">
          <a
            href="#hero-forge"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('hero-forge');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            藍圖與實例
          </a>
          <a
            href="#memory-sandbox"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('memory-sandbox');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            記憶體沙盒
          </a>
          <a
            href="#four-pillars"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('four-pillars');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            四大核心
          </a>
          <a
            href="#pitfalls"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('pitfalls');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            常見誤區
          </a>
        </nav>

        {/* Zone 3: Primary action & student identifier in top-right */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollToSection('challenge-lab')}
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 cursor-pointer"
          >
            {completedCount > 0 ? `實作挑戰 (${completedCount}/${totalChallenges})` : '開始實作挑戰'}
          </button>
          <span className="hidden sm:inline-block h-4 w-px bg-slate-200" aria-hidden="true" />
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap shrink-0 tabular-nums">
            b11413069李怡瑾
          </span>
        </div>
      </div>
    </header>
  );
};
