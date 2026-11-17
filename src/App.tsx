import { useEffect, useState } from 'react';
import { TopNav } from './components/TopNav';
import { HeroObjectForge } from './components/HeroObjectForge';
import { MemoryVisualizerSandbox } from './components/MemoryVisualizerSandbox';
import { FourPillarsStudio } from './components/FourPillarsStudio';
import { CommonPitfalls } from './components/CommonPitfalls';
import { ChallengeLab } from './components/ChallengeLab';
import { CHALLENGES } from './data/curriculum';

const STORAGE_KEY = 'python_object_lab_completed_v1';

export default function App() {
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedIds]);

  const handleChallengePassed = (challengeId: string) => {
    setCompletedIds((prev) => (prev.includes(challengeId) ? prev : [...prev, challengeId]));
  };

  const handleResetProgress = () => {
    setCompletedIds([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopNav completedCount={completedIds.length} totalChallenges={CHALLENGES.length} />

      <main className="flex-1">
        <HeroObjectForge />
        <MemoryVisualizerSandbox />
        <FourPillarsStudio />
        <CommonPitfalls />
        <ChallengeLab
          completedIds={completedIds}
          onChallengePassed={handleChallengePassed}
        />
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-8">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Python 物件實驗室 · 互動式物件導向與記憶體模型學習網頁
          </div>
          <div className="flex items-center gap-6">
            <a href="#memory-sandbox" className="hover:text-slate-800 transition-colors">
              記憶體沙盒
            </a>
            <a href="#four-pillars" className="hover:text-slate-800 transition-colors">
              四大核心
            </a>
            <a href="#challenge-lab" className="hover:text-slate-800 transition-colors">
              實作挑戰
            </a>
            {completedIds.length > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="text-slate-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
              >
                清除完成紀錄
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
