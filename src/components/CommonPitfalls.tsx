import React, { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { PITFALLS } from '../data/curriculum';

export const CommonPitfalls: React.FC = () => {
  const [selectedId, setSelectedId] = useState(PITFALLS[0].id);
  const current = PITFALLS.find((p) => p.id === selectedId) || PITFALLS[0];

  return (
    <section id="pitfalls" className="py-14 lg:py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6 space-y-8">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-1.5">
            除錯實戰 · 避開初學者最常踩的物件陷阱
          </p>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            03. 常見 Python 物件錯誤診斷
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Pitfall Selector List */}
          <div className="lg:col-span-4 space-y-2.5">
            {PITFALLS.map((item) => {
              const active = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? 'bg-white border-sky-600 shadow-xs'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-500 mb-1">{item.errorType}</div>
                  <div className="font-display text-sm font-semibold text-slate-900">
                    {item.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Pitfall Comparison */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <div className="text-xs font-medium text-sky-700 mb-1">{current.errorType}</div>
              <h3 className="font-display text-xl font-bold text-slate-900">{current.title}</h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{current.symptom}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-red-200 bg-red-50/40 rounded-lg p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  <span>錯誤寫法 (容易出錯)</span>
                </div>
                <pre className="text-xs font-mono leading-relaxed bg-slate-900 text-slate-100 p-3.5 rounded-md overflow-x-auto">
                  {current.wrongCode}
                </pre>
              </div>

              <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>正確寫法 (推薦實踐)</span>
                </div>
                <pre className="text-xs font-mono leading-relaxed bg-slate-900 text-slate-100 p-3.5 rounded-md overflow-x-auto">
                  {current.rightCode}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 mr-2">底層原因：</span>
              {current.why}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
