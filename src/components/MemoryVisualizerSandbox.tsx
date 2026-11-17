import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Code2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { MEMORY_SCENARIOS } from '../data/curriculum';
import { ExecutionStep, simulatePythonCode } from '../engine/pythonSimulator';

interface ArrowLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  highlighted: boolean;
  isAlias: boolean;
}

export const MemoryVisualizerSandbox: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(MEMORY_SCENARIOS[0].id);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [codeDraft, setCodeDraft] = useState(MEMORY_SCENARIOS[0].code);
  const [activeCode, setActiveCode] = useState(MEMORY_SCENARIOS[0].code);

  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  const simulation = useMemo(() => simulatePythonCode(activeCode), [activeCode]);
  const steps = simulation.steps;
  const currentStep: ExecutionStep | undefined = steps[Math.min(stepIdx, Math.max(0, steps.length - 1))];

  const stageRef = useRef<HTMLDivElement | null>(null);
  const varRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const objRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [arrows, setArrows] = useState<ArrowLine[]>([]);

  // Switch scenario
  const handleSelectScenario = (scenarioId: string) => {
    const found = MEMORY_SCENARIOS.find((s) => s.id === scenarioId);
    if (!found) return;
    setSelectedScenarioId(scenarioId);
    setCodeDraft(found.code);
    setActiveCode(found.code);
    setIsEditingCode(false);
    setStepIdx(0);
    setIsPlaying(false);
  };

  // Run custom code
  const handleCompileCustom = () => {
    setActiveCode(codeDraft);
    setIsEditingCode(false);
    setStepIdx(0);
    setIsPlaying(false);
  };

  // Auto-playback timer
  useEffect(() => {
    if (!isPlaying) return;
    if (stepIdx >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const intervalMs = Math.round(1350 / speedMultiplier);
    const timer = window.setTimeout(() => {
      setStepIdx((prev) => Math.min(prev + 1, steps.length - 1));
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, stepIdx, steps.length, speedMultiplier]);

  // Calculate SVG arrows between variables and heap objects
  const recomputeArrows = () => {
    const container = stageRef.current;
    if (!container || !currentStep) {
      setArrows([]);
      return;
    }
    const cRect = container.getBoundingClientRect();
    const nextArrows: ArrowLine[] = [];

    // Count how many variables point to each object to detect aliases
    const targetCounts: Record<string, number> = {};
    currentStep.variables.forEach((v) => {
      targetCounts[v.objectId] = (targetCounts[v.objectId] || 0) + 1;
    });

    currentStep.variables.forEach((v) => {
      const vEl = varRefs.current[v.name];
      const oEl = objRefs.current[v.objectId];
      if (!vEl || !oEl) return;
      const vRect = vEl.getBoundingClientRect();
      const oRect = oEl.getBoundingClientRect();
      nextArrows.push({
        id: `${v.name}-${v.objectId}`,
        x1: vRect.right - cRect.left,
        y1: vRect.top + vRect.height / 2 - cRect.top,
        x2: oRect.left - cRect.left,
        y2: oRect.top + Math.min(34, oRect.height / 2) - cRect.top,
        highlighted: Boolean(v.changed),
        isAlias: (targetCounts[v.objectId] || 0) > 1,
      });
    });

    setArrows(nextArrows);
  };

  useLayoutEffect(() => {
    recomputeArrows();
    const raf = requestAnimationFrame(recomputeArrows);
    return () => cancelAnimationFrame(raf);
  }, [currentStep, stepIdx, activeCode]);

  useEffect(() => {
    const handleResize = () => recomputeArrows();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep]);

  const activeScenario = MEMORY_SCENARIOS.find((s) => s.id === selectedScenarioId);
  const codeLines = activeCode.split(/\r?\n/);

  return (
    <section id="memory-sandbox" className="py-14 lg:py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6 space-y-6">
        {/* Section Header + Scenario Segmented Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-sky-700 mb-1.5">
              單步視覺化追蹤 · 名稱空間與堆積記憶體
            </p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              01. 互動式記憶體物件沙盒
            </h2>
          </div>

          {/* Interactive Scenario Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg border border-slate-200">
            {MEMORY_SCENARIOS.map((sc) => {
              const active = sc.id === selectedScenarioId && !isEditingCode;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(sc.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sc.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Zone Sandbox Layout (62% Left Visual Stage / 38% Right Code & Control Deck) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT ZONE: Visual Memory Stage (7 cols ~58-62%) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            {/* Stage Top Bar: Active Classes & Call Stack */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">記憶體空間圖譜</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  步驟 {steps.length > 0 ? stepIdx + 1 : 0} / {steps.length}
                </span>
              </div>

              {currentStep && currentStep.classes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">已註冊類別:</span>
                  {currentStep.classes.map((cls) => (
                    <span
                      key={cls.name}
                      className="font-mono font-medium text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded"
                    >
                      {cls.name}
                      {cls.bases.length > 0 ? `(${cls.bases.join(', ')})` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive SVG + Node Memory Canvas */}
            <div
              ref={stageRef}
              className="relative p-6 min-h-[390px] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:18px_18px]"
            >
              {/* SVG Connector Layer (Desktop) */}
              <svg
                className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none z-10"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="arrow-sky"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L7,3 z" fill="#0284c7" />
                  </marker>
                  <marker
                    id="arrow-amber"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L7,3 z" fill="#d97706" />
                  </marker>
                  <marker
                    id="arrow-slate"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L7,3 z" fill="#64748b" />
                  </marker>
                </defs>
                {arrows.map((a) => {
                  const dx = Math.max(40, Math.abs(a.x2 - a.x1) * 0.45);
                  const pathD = `M ${a.x1} ${a.y1} C ${a.x1 + dx} ${a.y1}, ${a.x2 - dx} ${a.y2}, ${a.x2 - 4} ${a.y2}`;
                  const strokeColor = a.highlighted
                    ? '#d97706'
                    : a.isAlias
                      ? '#0284c7'
                      : '#64748b';
                  const markerId = a.highlighted
                    ? 'url(#arrow-amber)'
                    : a.isAlias
                      ? 'url(#arrow-sky)'
                      : 'url(#arrow-slate)';
                  return (
                    <path
                      key={a.id}
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={a.highlighted || a.isAlias ? 2.2 : 1.6}
                      strokeDasharray={a.isAlias ? '5 3' : undefined}
                      markerEnd={markerId}
                    />
                  );
                })}
              </svg>

              {!currentStep ? (
                <div className="flex items-center justify-center h-64 text-sm text-slate-500">
                  請按下「執行並追蹤記憶體」或選擇左側預設範例以開始模擬。
                </div>
              ) : (
                <div className="relative z-20 grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Variables / References */}
                  <div className="sm:col-span-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-500 pb-1 border-b border-slate-200">
                      全域名稱空間 (變數參考)
                    </div>
                    {currentStep.variables.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4">
                        尚未建立變數參考（目前僅註冊藍圖或尚未賦值）。
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {currentStep.variables.map((v) => {
                          const targetObj = currentStep.objects.find((o) => o.id === v.objectId);
                          return (
                            <div
                              key={v.name}
                              ref={(el) => {
                                varRefs.current[v.name] = el;
                              }}
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${
                                v.changed
                                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <span className="font-semibold">{v.name}</span>
                              <span className="text-slate-400 text-[11px] tabular-nums">
                                → {targetObj?.address || ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Heap Objects */}
                  <div className="sm:col-span-8 space-y-3">
                    <div className="text-xs font-semibold text-slate-500 pb-1 border-b border-slate-200">
                      堆積記憶體 (Heap Objects)
                    </div>

                    {currentStep.objects.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4">
                        記憶體堆積目前為空。點擊「下一步」觀察物件建立過程。
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {currentStep.objects.map((obj) => {
                          const attrEntries = Object.entries(obj.attrs);
                          const statusBorder = obj.isNew
                            ? 'border-sky-400 ring-2 ring-sky-100'
                            : obj.isMutated
                              ? 'border-amber-400 ring-2 ring-amber-100'
                              : 'border-slate-200';

                          return (
                            <div
                              key={obj.id}
                              ref={(el) => {
                                objRefs.current[obj.id] = el;
                              }}
                              className={`bg-white border rounded-lg p-3.5 transition-all ${statusBorder}`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-mono font-semibold text-slate-900">
                                    {obj.typeName}
                                  </span>
                                  <span className="text-slate-400" aria-hidden="true">·</span>
                                  <span className="font-mono text-slate-500 tabular-nums">
                                    id: {obj.address}
                                  </span>
                                  <span className="text-slate-400" aria-hidden="true">·</span>
                                  <span className="text-slate-500 tabular-nums">
                                    參考數: {obj.refCount}
                                  </span>
                                </div>

                                {obj.isNew && (
                                  <span className="text-[11px] font-semibold text-sky-700">
                                    ★ 新配置物件
                                  </span>
                                )}
                                {!obj.isNew && obj.isMutated && (
                                  <span className="text-[11px] font-semibold text-amber-700">
                                    ↻ 內容已變更
                                  </span>
                                )}
                              </div>

                              {/* Object Payload */}
                              {obj.kind === 'instance' && (
                                <div className="pt-2.5 space-y-1.5">
                                  {attrEntries.length === 0 ? (
                                    <div className="text-xs font-mono text-slate-400">
                                      (尚無實例屬性)
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                                      {attrEntries.map(([k, val]) => (
                                        <div
                                          key={k}
                                          className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded border border-slate-100"
                                        >
                                          <span className="text-slate-500">.{k}</span>
                                          <span className="text-slate-900 font-medium truncate max-w-[140px]">
                                            {val.display}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {obj.kind === 'list' && obj.listItems && (
                                <div className="pt-2.5 flex flex-wrap gap-1.5">
                                  {obj.listItems.length === 0 ? (
                                    <span className="text-xs font-mono text-slate-400">[]</span>
                                  ) : (
                                    obj.listItems.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono tabular-nums"
                                      >
                                        <span className="text-slate-400 mr-1.5">[{idx}]</span>
                                        <span className="text-slate-900 font-medium">{item.display}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}

                              {obj.kind === 'primitive' && (
                                <div className="pt-2 text-xs font-mono text-slate-800">
                                  值: <span className="font-semibold">{obj.displayValue}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Explanation + Console Strip */}
            <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
              {currentStep?.error ? (
                <div className="flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold block">執行例外</span>
                    <span className="font-mono">{currentStep.error}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-3">
                  <Sparkles className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="text-xs font-semibold text-sky-700 block mb-0.5">
                      執行解說 · 第 {currentStep?.lineNumber || 1} 行
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {currentStep?.explanation || activeScenario?.conceptFocus}
                    </p>
                  </div>
                </div>
              )}

              {/* Console Output */}
              <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 pb-1.5 mb-1.5 border-b border-slate-800">
                  <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>主控台輸出 (stdout)</span>
                </div>
                {currentStep && currentStep.stdout.length > 0 ? (
                  <div className="space-y-1">
                    {currentStep.stdout.map((line, i) => (
                      <div key={i} className="text-emerald-300">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500">（目前尚無 print 輸出）</div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT ZONE: Control & Code Deck (5 cols ~38-42%) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            {/* Scenario Context */}
            <div className="pb-4 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {isEditingCode ? '自訂 Python 物件程式碼' : activeScenario?.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isEditingCode
                  ? '自由編寫 class、__init__、繼承或 list 參考，完成後點擊「執行並追蹤」。'
                  : activeScenario?.subtitle}
              </p>
            </div>

            {/* Playback Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIdx((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={stepIdx <= 0}
                    aria-label="上一步"
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>上一步</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (stepIdx >= steps.length - 1) setStepIdx(0);
                      setIsPlaying((p) => !p);
                    }}
                    disabled={steps.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>暫停</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{stepIdx >= steps.length - 1 ? '重播' : '自動播放'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIdx((prev) => Math.min(steps.length - 1, prev + 1));
                    }}
                    disabled={stepIdx >= steps.length - 1}
                    aria-label="下一步"
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>下一步</span>
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIdx(0);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>重設</span>
                </button>
              </div>

              {/* Speed Slider with explicit label and numeric unit */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <label htmlFor="sim-speed" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  模擬速度: <span className="font-mono tabular-nums text-slate-900">{speedMultiplier.toFixed(1)}x</span>
                </label>
                <input
                  id="sim-speed"
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.5}
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                  className="w-40 accent-sky-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Code Deck: Toggle between Line-Tracked View & Editable Textarea */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Python 程式碼追蹤</span>
                <button
                  type="button"
                  onClick={() => setIsEditingCode((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isEditingCode ? '回到單步高亮檢視' : '編輯自訂程式'}</span>
                </button>
              </div>

              {isEditingCode ? (
                <div className="space-y-2.5">
                  <textarea
                    value={codeDraft}
                    onChange={(e) => setCodeDraft(e.target.value)}
                    spellCheck={false}
                    rows={14}
                    aria-label="自訂 Python 程式碼編輯器"
                    className="w-full p-3 text-xs font-mono leading-relaxed bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 resize-y"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCodeDraft(activeCode);
                        setIsEditingCode(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-md cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleCompileCustom}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md cursor-pointer"
                    >
                      執行並追蹤記憶體
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto border border-slate-800">
                  <div className="font-mono text-xs leading-6 min-w-max">
                    {codeLines.map((line, idx) => {
                      const lineNo = idx + 1;
                      const isActive = currentStep?.lineNumber === lineNo;
                      return (
                        <div
                          key={lineNo}
                          className={`flex items-center gap-3 px-2 rounded ${
                            isActive ? 'bg-sky-500/25 text-white' : 'text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-5 text-right select-none tabular-nums ${
                              isActive ? 'text-sky-300 font-semibold' : 'text-slate-600'
                            }`}
                          >
                            {lineNo}
                          </span>
                          <span className="whitespace-pre">{line || ' '}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
