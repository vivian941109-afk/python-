import React, { useState } from 'react';
import { ArrowDown, BatteryCharging, Navigation, Plus, RotateCcw } from 'lucide-react';

interface SpawnedDrone {
  varName: string;
  address: string;
  name: string;
  battery: number;
  missions: number;
  lastLog: string;
}

const INITIAL_DRONES: SpawnedDrone[] = [
  {
    varName: 'd1',
    address: '0x10A0',
    name: 'Scout',
    battery: 90,
    missions: 1,
    lastLog: '已建立實例 d1 = Drone("Scout", 90)',
  },
];

export const HeroObjectForge: React.FC = () => {
  const [nameInput, setNameInput] = useState('Falcon');
  const [batteryInput, setBatteryInput] = useState(80);
  const [drones, setDrones] = useState<SpawnedDrone[]>(INITIAL_DRONES);
  const [nextHex, setNextHex] = useState(0x10c8);

  const handleSpawn = (e: React.FormEvent) => {
    e.preventDefault();
    if (drones.length >= 3) return;
    const cleanName = nameInput.trim() || `Unit${drones.length + 1}`;
    const varName = `d${drones.length + 1}`;
    const address = `0x${nextHex.toString(16).toUpperCase()}`;
    setNextHex((prev) => prev + 0x28);
    setDrones((prev) => [
      ...prev,
      {
        varName,
        address,
        name: cleanName,
        battery: batteryInput,
        missions: 0,
        lastLog: `呼叫 __init__(self, "${cleanName}", ${batteryInput})`,
      },
    ]);
    setNameInput(drones.length === 1 ? 'Atlas' : 'Nova');
  };

  const handleFly = (idx: number) => {
    setDrones((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        if (d.battery < 20) {
          return { ...d, lastLog: `${d.varName}.fly() → 電量不足，無法起飛` };
        }
        return {
          ...d,
          battery: d.battery - 20,
          missions: d.missions + 1,
          lastLog: `${d.varName}.fly() → 完成第 ${d.missions + 1} 次巡航`,
        };
      })
    );
  };

  const handleCharge = (idx: number) => {
    setDrones((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const nextBat = Math.min(100, d.battery + 25);
        return {
          ...d,
          battery: nextBat,
          lastLog: `${d.varName}.charge() → 電量充至 ${nextBat}%`,
        };
      })
    );
  };

  const handleReset = () => {
    setDrones(INITIAL_DRONES);
    setNextHex(0x10c8);
    setNameInput('Falcon');
    setBatteryInput(80);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="hero-forge" className="border-b border-slate-200 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Editorial Column */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-8">
          <div>
            <p className="text-xs font-medium text-sky-700 tracking-wide mb-3">
              互動式物件導向學習 · 記憶體視覺化 · 實作驗證
            </p>
            <h1
              className="font-display font-bold text-slate-900 tracking-tight leading-[1.15] mb-5"
              style={{ fontSize: 'clamp(2.1rem, 3.4vw, 3.1rem)', textWrap: 'balance' }}
            >
              看懂 Python 物件在記憶體中的真實運作
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              在 Python 裡，「萬物皆物件」。變數不是裝資料的盒子，而是指向記憶體物件的參考標籤。透過即時的物件生成台與記憶體追蹤器，一步步掌握
              <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 text-sm">class</code>、
              <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 text-sm">self</code>、繼承與多型。
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => scrollTo('memory-sandbox')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>進入記憶體沙盒</span>
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo('four-pillars')}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                探索 OOP 四大核心
              </button>
            </div>

            {/* Key Concept Triplet - unboxed clean typography with hairline top rule */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
              <div>
                <div className="font-mono text-sm font-semibold text-slate-900">id(obj)</div>
                <div className="text-xs text-slate-500 mt-1">每個物件的唯一記憶體身分</div>
              </div>
              <div>
                <div className="font-mono text-sm font-semibold text-slate-900">type(obj)</div>
                <div className="text-xs text-slate-500 mt-1">決定物件擁有什麼方法與結構</div>
              </div>
              <div>
                <div className="font-mono text-sm font-semibold text-slate-900">self</div>
                <div className="text-xs text-slate-500 mt-1">自動指向正在操作的那個實例</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Interactive Live Object Forge */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                現場實驗：從 Class 藍圖鑄造實例
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                藍圖只有一份，但每次呼叫 Drone(...) 都會配置一塊獨立的實例記憶體
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>重設實例</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Blueprint Definition + Instantiation Form */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-sky-700">類別藍圖 (Class)</span>
                <span className="font-mono">class Drone</span>
              </div>
              <pre className="text-xs font-mono leading-relaxed text-slate-800 bg-slate-50 p-3 rounded border border-slate-200 overflow-x-auto">
{`class Drone:
    def __init__(self, name, battery):
        self.name = name
        self.battery = battery
        self.missions = 0

    def fly(self):
        self.battery -= 20
        self.missions += 1`}
              </pre>

              <form onSubmit={handleSpawn} className="space-y-3 pt-1">
                <div>
                  <label htmlFor="drone-name" className="block text-xs font-medium text-slate-700 mb-1">
                    實例名稱 (name)
                  </label>
                  <input
                    id="drone-name"
                    type="text"
                    maxLength={12}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                    <label htmlFor="drone-battery">初始電量 (battery)</label>
                    <span className="font-mono tabular-nums text-sky-700">{batteryInput}%</span>
                  </div>
                  <input
                    id="drone-battery"
                    type="range"
                    min={20}
                    max={100}
                    step={10}
                    value={batteryInput}
                    onChange={(e) => setBatteryInput(Number(e.target.value))}
                    className="w-full accent-sky-700 cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  disabled={drones.length >= 3}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 disabled:text-slate-500 rounded-md transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {drones.length >= 3
                      ? '已達示範上限 (3 個實例)'
                      : `建立實例 d${drones.length + 1} = Drone("${nameInput || 'Unit'}", ${batteryInput})`}
                  </span>
                </button>
              </form>
            </div>

            {/* Spawned Independent Instance Objects */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>記憶體堆積中的獨立實例 ({drones.length}/3)</span>
                <span className="font-mono tabular-nums">
                  {drones.length >= 2 ? 'd1 is d2 → False' : '點擊按鈕測試方法'}
                </span>
              </div>

              {drones.map((drone, idx) => (
                <div
                  key={drone.varName}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 transition-all duration-150"
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-semibold text-sky-700">{drone.varName}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-mono font-medium text-slate-900">Drone 實例</span>
                    </div>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      id: {drone.address}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2.5 text-xs font-mono tabular-nums">
                    <div>
                      <span className="text-slate-400 block">self.name</span>
                      <span className="text-slate-900 font-medium">"{drone.name}"</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">self.battery</span>
                      <span
                        className={`font-semibold ${
                          drone.battery < 30 ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {drone.battery}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">self.missions</span>
                      <span className="text-slate-900 font-medium">{drone.missions}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500 truncate max-w-[230px]" title={drone.lastLog}>
                      {drone.lastLog}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleFly(idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" aria-hidden="true" />
                        <span>.fly()</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCharge(idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 rounded transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <BatteryCharging className="w-3 h-3" aria-hidden="true" />
                        <span>.charge()</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
