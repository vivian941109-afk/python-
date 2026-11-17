import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Play, ShieldCheck } from 'lucide-react';

type PillarTab = 'encapsulation' | 'inheritance' | 'polymorphism' | 'dunder';

interface MroNode {
  id: string;
  label: string;
  parents: string[];
  methods: string[];
  mro: string[];
  moveSource: string;
  moveOutput: string;
}

const MRO_NODES: Record<string, MroNode> = {
  Animal: {
    id: 'Animal',
    label: 'Animal',
    parents: ['object'],
    methods: ['breathe()'],
    mro: ['Animal', 'object'],
    moveSource: '無 move() 方法',
    moveOutput: "AttributeError: 'Animal' 沒有 'move' 方法",
  },
  Mammal: {
    id: 'Mammal',
    label: 'Mammal(Animal)',
    parents: ['Animal'],
    methods: ['move() → "陸地奔跑"'],
    mro: ['Mammal', 'Animal', 'object'],
    moveSource: 'Mammal.move()',
    moveOutput: '陸地奔跑 (定義於 Mammal)',
  },
  Flyer: {
    id: 'Flyer',
    label: 'Flyer',
    parents: ['object'],
    methods: ['move() → "振翅飛行"'],
    mro: ['Flyer', 'object'],
    moveSource: 'Flyer.move()',
    moveOutput: '振翅飛行 (定義於 Flyer)',
  },
  Bat: {
    id: 'Bat',
    label: 'Bat(Mammal, Flyer)',
    parents: ['Mammal', 'Flyer'],
    methods: ['echolocate()'],
    mro: ['Bat', 'Mammal', 'Flyer', 'object'],
    moveSource: 'Mammal.move()（依 MRO 先找到 Mammal）',
    moveOutput: '陸地奔跑（Bat 本身沒有 move，順著 MRO 先找到左側父類 Mammal）',
  },
  FlyingFox: {
    id: 'FlyingFox',
    label: 'FlyingFox(Flyer, Mammal)',
    parents: ['Flyer', 'Mammal'],
    methods: ['glide()'],
    mro: ['FlyingFox', 'Flyer', 'Mammal', 'object'],
    moveSource: 'Flyer.move()（依 MRO 先找到 Flyer）',
    moveOutput: '振翅飛行（繼承順序把 Flyer 放前面，MRO 優先採用 Flyer.move）',
  },
};

export const FourPillarsStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PillarTab>('encapsulation');

  // Tab 1: Encapsulation state
  const [usePropertyGuard, setUsePropertyGuard] = useState(true);
  const [celsius, setCelsius] = useState(25);
  const [attemptedTemp, setAttemptedTemp] = useState<number>(25);
  const [guardError, setGuardError] = useState<string | null>(null);

  const applyTemp = (nextVal: number) => {
    setAttemptedTemp(nextVal);
    if (usePropertyGuard && nextVal < -273.15) {
      setGuardError(`ValueError: 溫度 ${nextVal}°C 低於絕對零度 (-273.15°C)，已由 @celsius.setter 攔截！`);
    } else {
      setGuardError(null);
      setCelsius(nextVal);
    }
  };

  // Tab 2: Inheritance / MRO state
  const [selectedClassId, setSelectedClassId] = useState<string>('Bat');
  const selectedMroNode = MRO_NODES[selectedClassId];

  // Tab 3: Polymorphism state
  const [enabledShapes, setEnabledShapes] = useState<Record<string, boolean>>({
    circle: true,
    rect: true,
    triangle: true,
  });
  const [polyExecuted, setPolyExecuted] = useState(true);

  const shapeItems = [
    {
      id: 'circle',
      cls: 'Circle(r=5)',
      formula: '3.14 * 5 * 5',
      area: '78.5',
    },
    {
      id: 'rect',
      cls: 'Rectangle(w=4, h=6)',
      formula: '4 * 6',
      area: '24.0',
    },
    {
      id: 'triangle',
      cls: 'Triangle(b=8, h=3)',
      formula: '0.5 * 8 * 3',
      area: '12.0',
    },
  ].filter((s) => enabledShapes[s.id]);

  // Tab 4: Dunder methods state
  const [enableStr, setEnableStr] = useState(true);
  const [enableLen, setEnableLen] = useState(true);
  const [enableAdd, setEnableAdd] = useState(true);

  const tabs: { id: PillarTab; label: string }[] = [
    { id: 'encapsulation', label: '01. 封裝與 @property' },
    { id: 'inheritance', label: '02. 繼承與 MRO 順序' },
    { id: 'polymorphism', label: '03. 鴨子型別與多型' },
    { id: 'dunder', label: '04. 魔術方法 (__dunder__)' },
  ];

  return (
    <section id="four-pillars" className="py-14 lg:py-16 bg-white border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-sky-700 mb-1.5">
              物件導向設計原理 · 互動式機制實測
            </p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              02. Python OOP 四大核心實驗台
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: Encapsulation & @property */}
        {activeTab === 'encapsulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  為什麼需要封裝？用 @property 守住物件資料合法性
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Python 沒有強硬的編譯期 private 關鍵字，而是透過慣例（單底線
                <code className="mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs">_celsius</code>
                表示內部屬性）與
                <code className="mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs">@property</code>
                裝飾器，讓外部維持直覺的「點語法賦值」，卻在背後自動執行檢查邏輯。
              </p>

              <pre className="text-xs font-mono leading-relaxed bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
{`class Thermostat:
    def __init__(self, celsius):
        self._celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        ${
          usePropertyGuard
            ? `if value < -273.15:
            raise ValueError("溫度不能低於絕對零度！")
        self._celsius = value`
            : `# 未開啟驗證：任何數值都會直接覆寫
        self._celsius = value`
        }`}
              </pre>
            </div>

            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">驗證機制切換</span>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setUsePropertyGuard(true);
                        setGuardError(null);
                        if (celsius < -273.15) setCelsius(25);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        usePropertyGuard ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      啟用 @property 防護
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsePropertyGuard(false);
                        setGuardError(null);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        !usePropertyGuard ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      無驗證直接賦值
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <label htmlFor="temp-slider">嘗試設定 t.celsius 數值</label>
                    <span className="font-mono tabular-nums text-slate-900 font-semibold">
                      嘗試賦值: {attemptedTemp}°C
                    </span>
                  </div>
                  <input
                    id="temp-slider"
                    type="range"
                    min={-350}
                    max={100}
                    step={5}
                    value={attemptedTemp}
                    onChange={(e) => applyTemp(Number(e.target.value))}
                    className="w-full accent-sky-700 cursor-pointer"
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => applyTemp(25)}
                      className="px-3 py-1.5 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors cursor-pointer"
                    >
                      t.celsius = 25
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemp(-100)}
                      className="px-3 py-1.5 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors cursor-pointer"
                    >
                      t.celsius = -100
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemp(-300)}
                      className="px-3 py-1.5 text-xs font-mono bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded transition-colors cursor-pointer"
                    >
                      t.celsius = -300 (物理非法值)
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">目前實例內部狀態 <code className="font-mono text-slate-900">t._celsius</code>:</span>
                  <span
                    className={`font-mono font-bold text-lg tabular-nums ${
                      celsius < -273.15 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {celsius}°C
                  </span>
                </div>

                {guardError ? (
                  <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-mono">{guardError}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {celsius < -273.15
                        ? '警告：因未啟用 Setter 防護，物件內部已存入不合理的物理溫度！'
                        : '狀態合法：物件維持在合理的溫度範圍內。'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Inheritance & MRO */}
        {activeTab === 'inheritance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  點擊類別節點，追蹤 Python 的 MRO 方法解析順序
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  當一個類別多重繼承多個父類別時，Python 使用 C3 線性化演算法決定 <code className="font-mono">__mro__</code> 查找路徑（由左至右、深度優先且不重複）。
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
                {/* Interactive Hierarchy Rows */}
                <div className="flex flex-col items-center gap-4">
                  {/* Root */}
                  <button
                    type="button"
                    onClick={() => setSelectedClassId('Animal')}
                    className={`px-4 py-2 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                      selectedClassId === 'Animal'
                        ? 'bg-sky-700 text-white border-sky-700'
                        : selectedMroNode.mro.includes('Animal')
                          ? 'bg-sky-50 text-sky-900 border-sky-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    class Animal · breathe()
                  </button>

                  {/* Middle Tier */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <button
                      type="button"
                      onClick={() => setSelectedClassId('Mammal')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedClassId === 'Mammal'
                          ? 'bg-sky-700 text-white border-sky-700'
                          : selectedMroNode.mro.includes('Mammal')
                            ? 'bg-sky-50 text-sky-900 border-sky-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Mammal(Animal)
                      <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                        定義 move(): 陸地奔跑
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedClassId('Flyer')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedClassId === 'Flyer'
                          ? 'bg-sky-700 text-white border-sky-700'
                          : selectedMroNode.mro.includes('Flyer')
                            ? 'bg-sky-50 text-sky-900 border-sky-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Flyer
                      <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                        定義 move(): 振翅飛行
                      </span>
                    </button>
                  </div>

                  {/* Leaf Tier */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                    <button
                      type="button"
                      onClick={() => setSelectedClassId('Bat')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedClassId === 'Bat'
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Bat(Mammal, Flyer)
                      <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                        Mammal 在前，Flyer 在後
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedClassId('FlyingFox')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedClassId === 'FlyingFox'
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      FlyingFox(Flyer, Mammal)
                      <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                        Flyer 在前，Mammal 在後
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-sky-700">目前檢視類別</span>
                  <h4 className="font-mono text-lg font-bold text-slate-900 mt-0.5">
                    {selectedMroNode.label}
                  </h4>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-2">
                    MRO 查找鏈 ({selectedMroNode.id}.__mro__)
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                    {selectedMroNode.mro.map((clsName, idx) => (
                      <React.Fragment key={clsName}>
                        <span
                          className={`px-2.5 py-1 rounded border ${
                            idx === 0
                              ? 'bg-sky-700 text-white border-sky-700 font-semibold'
                              : 'bg-slate-50 text-slate-800 border-slate-200'
                          }`}
                        >
                          {idx + 1}. {clsName}
                        </span>
                        {idx < selectedMroNode.mro.length - 1 && (
                          <span className="text-slate-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs space-y-2">
                <div className="text-slate-400"># 實例呼叫 .move() 的查找結果</div>
                <div className="text-sky-300">
                  &gt;&gt;&gt; {selectedMroNode.id.toLowerCase()} = {selectedMroNode.id}()
                </div>
                <div className="text-sky-300">
                  &gt;&gt;&gt; {selectedMroNode.id.toLowerCase()}.move()
                </div>
                <div className="text-emerald-300 pt-1">{selectedMroNode.moveOutput}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Polymorphism & Duck Typing */}
        {activeTab === 'polymorphism' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="lg:col-span-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                鴨子型別 (Duck Typing)：重視行為，而非血統
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                在 Python 中，不同類別不需要繼承同一個介面或父類別；只要它們都實作了相同名稱的方法（例如
                <code className="mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs">.area()</code>
                ），就能放進同一個集合裡被一致地呼叫，大幅減少僵化的 <code className="font-mono text-xs">if isinstance(...)</code> 判斷。
              </p>
              <pre className="text-xs font-mono leading-relaxed bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
{`def total_area(shapes):
    # 多型呼叫：不檢查物件屬於哪個類別，
    # 只要物件有 .area() 方法即可運作
    for s in shapes:
        print(s.area())

shapes = [${shapeItems.map((s) => s.cls).join(', ')}]
total_area(shapes)`}
              </pre>
            </div>

            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">勾選要放入 shapes 清單的物件</span>
                  <button
                    type="button"
                    onClick={() => setPolyExecuted(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3" aria-hidden="true" />
                    <span>執行多型迴圈</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'circle', label: 'Circle(5)' },
                    { id: 'rect', label: 'Rectangle(4, 6)' },
                    { id: 'triangle', label: 'Triangle(8, 3)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setEnabledShapes((prev) => ({ ...prev, [opt.id]: !prev[opt.id] }))
                      }
                      className={`px-2.5 py-2 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                        enabledShapes[opt.id]
                          ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      {enabledShapes[opt.id] ? '✓ ' : '+ '}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-600">動態分派執行結果</div>
                {shapeItems.length === 0 ? (
                  <div className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-lg border border-slate-200">
                    shapes 串列目前為空，請至少選取一個物件。
                  </div>
                ) : (
                  polyExecuted && (
                    <div className="space-y-2">
                      {shapeItems.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        >
                          <span className="text-slate-900 font-semibold">{s.cls}.area()</span>
                          <span className="text-slate-500">{s.formula}</span>
                          <span className="text-emerald-700 font-bold tabular-nums">→ {s.area}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Dunder Methods */}
        {activeTab === 'dunder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="lg:col-span-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                魔術方法 (Dunder Methods)：讓自訂物件融入 Python 語法
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                前後雙底線的方法（例如 <code className="font-mono text-xs">__str__</code>、<code className="font-mono text-xs">__len__</code>、<code className="font-mono text-xs">__add__</code>）不是拿來直接呼叫的，而是當你使用 <code className="font-mono text-xs">print()</code>、<code className="font-mono text-xs">len()</code> 或 <code className="font-mono text-xs">+</code> 運算子時，Python 會自動觸發對應的特殊方法。
              </p>

              <div className="space-y-2.5 bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-slate-700 pb-1">
                  切換是否在 class Playlist 中實作下列魔術方法：
                </div>

                {[
                  {
                    key: 'str',
                    checked: enableStr,
                    toggle: () => setEnableStr((v) => !v),
                    name: '__str__(self)',
                    desc: '控制 print(p) 與 str(p) 顯示的人類可讀文字',
                  },
                  {
                    key: 'len',
                    checked: enableLen,
                    toggle: () => setEnableLen((v) => !v),
                    name: '__len__(self)',
                    desc: '讓內建函式 len(p) 可以回傳播放清單歌曲數',
                  },
                  {
                    key: 'add',
                    checked: enableAdd,
                    toggle: () => setEnableAdd((v) => !v),
                    name: '__add__(self, other)',
                    desc: '支援使用 p1 + p2 合併兩個 Playlist 物件',
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.toggle}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      item.checked
                        ? 'bg-sky-50 border-sky-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{item.desc}</div>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        item.checked ? 'text-sky-700' : 'text-slate-400'
                      }`}
                    >
                      {item.checked ? '✓ 已實作' : '未實作'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-lg p-5 flex flex-col justify-between font-mono text-xs space-y-4">
              <div className="space-y-3">
                <div className="text-slate-400 pb-2 border-b border-slate-800">
                  # 即時互動輸出：p1 = Playlist(["晴天", "七里香"]), p2 = Playlist(["稻香"])
                </div>

                <div className="space-y-1">
                  <div className="text-sky-300">&gt;&gt;&gt; print(p1)</div>
                  {enableStr ? (
                    <div className="text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Playlist(2 首歌: 晴天, 七里香)</span>
                    </div>
                  ) : (
                    <div className="text-amber-300">
                      &lt;__main__.Playlist object at 0x7f8a1040&gt;（預設只印出記憶體位址）
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="text-sky-300">&gt;&gt;&gt; len(p1)</div>
                  {enableLen ? (
                    <div className="text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>2</span>
                    </div>
                  ) : (
                    <div className="text-red-400">
                      TypeError: object of type &apos;Playlist&apos; has no len()
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="text-sky-300">&gt;&gt;&gt; p3 = p1 + p2; print(p3)</div>
                  {enableAdd ? (
                    <div className="text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {enableStr
                          ? 'Playlist(3 首歌: 晴天, 七里香, 稻香)'
                          : '<__main__.Playlist object at 0x7f8a1098>'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-red-400">
                      TypeError: unsupported operand type(s) for +: &apos;Playlist&apos; and &apos;Playlist&apos;
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                提示：所有內建型別（str, list, int）能用 + 與 len()，正是因為它們實作了這些魔術方法。
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
