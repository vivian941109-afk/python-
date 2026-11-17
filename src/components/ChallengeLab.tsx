import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Lightbulb,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { CHALLENGES, CodingChallenge } from '../data/curriculum';
import { simulatePythonCode } from '../engine/pythonSimulator';

interface TestOutcome {
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

interface ChallengeLabProps {
  completedIds: string[];
  onChallengePassed: (challengeId: string) => void;
}

export const ChallengeLab: React.FC<ChallengeLabProps> = ({
  completedIds,
  onChallengePassed,
}) => {
  const [selectedId, setSelectedId] = useState<string>(CHALLENGES[0].id);
  const challenge: CodingChallenge =
    CHALLENGES.find((c) => c.id === selectedId) || CHALLENGES[0];

  const [codeByChallenge, setCodeByChallenge] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    CHALLENGES.forEach((c) => {
      map[c.id] = c.starterCode;
    });
    return map;
  });

  const [showHint, setShowHint] = useState(false);
  const [outcomes, setOutcomes] = useState<TestOutcome[] | null>(null);

  const currentCode = codeByChallenge[challenge.id] ?? challenge.starterCode;

  useEffect(() => {
    setOutcomes(null);
    setShowHint(false);
  }, [selectedId]);

  const handleCodeChange = (nextVal: string) => {
    setCodeByChallenge((prev) => ({ ...prev, [challenge.id]: nextVal }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = currentCode.slice(0, start) + '    ' + currentCode.slice(end);
      handleCodeChange(updated);
      requestAnimationFrame(() => {
        target.selectionStart = start + 4;
        target.selectionEnd = start + 4;
      });
    }
  };

  const handleRunTests = () => {
    const results: TestOutcome[] = challenge.tests.map((test) => {
      const combined = `${currentCode}\n${test.checkCode}`;
      const sim = simulatePythonCode(combined, 160);
      const actualOut = sim.stdout.join('\n').trim();
      const passed = !sim.error && actualOut === test.expectedStdout.trim();
      return {
        description: test.description,
        passed,
        expected: test.expectedStdout.trim(),
        actual: actualOut || '(無輸出)',
        error: sim.error,
      };
    });

    setOutcomes(results);
    if (results.every((r) => r.passed)) {
      onChallengePassed(challenge.id);
    }
  };

  const allPassed = outcomes !== null && outcomes.length > 0 && outcomes.every((o) => o.passed);

  return (
    <section id="challenge-lab" className="py-14 lg:py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-sky-700 mb-1.5">
              即時驗證測試 · 親手撰寫 Python Class
            </p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              04. 物件導向實作挑戰
            </h2>
          </div>

          <div className="text-xs font-medium text-slate-600 tabular-nums">
            已完成挑戰：{completedIds.length} / {CHALLENGES.length}
          </div>
        </div>

        {/* Challenge Selector Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CHALLENGES.map((item) => {
            const isSelected = item.id === challenge.id;
            const isDone = completedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/70 border-sky-600'
                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="tabular-nums">
                    任務 {item.number} · {item.difficulty}
                  </span>
                  {isDone && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>已完成</span>
                    </span>
                  )}
                </div>
                <div className="font-display text-sm font-semibold text-slate-900">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Two-Zone Challenge Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Spec & Test Results */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <div className="text-xs text-slate-500 mb-1">
                任務 {challenge.number} · {challenge.difficulty}
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">{challenge.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{challenge.summary}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-800">規格要求：</div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                {challenge.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono font-semibold text-sky-700 tabular-nums">
                      {idx + 1}.
                    </span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {showHint && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 leading-relaxed">
                <span className="font-semibold block mb-1">解題提示：</span>
                {challenge.hint}
              </div>
            )}

            {/* Test Outcomes */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>自動化測試結果</span>
                {allPassed && (
                  <span className="text-emerald-700">✓ 全部測試通過</span>
                )}
              </div>

              {outcomes === null ? (
                <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg p-4">
                  在右側完成程式碼後，點擊「執行並驗證測試」即可即時檢驗輸出與物件狀態。
                </div>
              ) : (
                <div className="space-y-2.5">
                  {outcomes.map((o, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        o.passed
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-red-50/70 border-red-200 text-red-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-semibold">
                        <span>{o.description}</span>
                        <span className="inline-flex items-center gap-1 shrink-0">
                          {o.passed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                              <span className="text-emerald-700">通過</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                              <span className="text-red-700">未通過</span>
                            </>
                          )}
                        </span>
                      </div>

                      {!o.passed && (
                        <div className="font-mono text-[11px] space-y-1 pt-1 text-slate-700">
                          <div>預期輸出: {o.expected}</div>
                          <div>實際輸出: {o.error ? o.error : o.actual}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Code Editor */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-slate-300">
                solution.py · 支援 Tab 四格縮排
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{showHint ? '隱藏提示' : '顯示提示'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCodeChange(challenge.solutionCode);
                    setOutcomes(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>參考解答</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCodeChange(challenge.starterCode);
                    setOutcomes(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>重設</span>
                </button>
              </div>
            </div>

            <textarea
              value={currentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              rows={15}
              aria-label="Python 實作挑戰程式碼編輯區"
              className="w-full p-5 bg-slate-900 text-slate-100 font-mono text-sm leading-relaxed focus:outline-none resize-y"
            />

            <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                點擊右側按鈕透過內建 Python 物件直譯器驗證
              </span>
              <button
                type="button"
                onClick={handleRunTests}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>執行並驗證測試</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
