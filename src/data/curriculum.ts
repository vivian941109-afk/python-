export interface MemoryScenario {
  id: string;
  title: string;
  subtitle: string;
  conceptFocus: string;
  code: string;
}

export interface ChallengeTest {
  description: string;
  checkCode: string;
  expectedStdout: string;
}

export interface CodingChallenge {
  id: string;
  number: string;
  title: string;
  difficulty: '基礎' | '進階' | '實戰';
  summary: string;
  requirements: string[];
  starterCode: string;
  hint: string;
  solutionCode: string;
  tests: ChallengeTest[];
}

export interface PitfallItem {
  id: string;
  title: string;
  errorType: string;
  symptom: string;
  wrongCode: string;
  rightCode: string;
  why: string;
}

export const MEMORY_SCENARIOS: MemoryScenario[] = [
  {
    id: 'references',
    title: '01. 參考與可變物件',
    subtitle: '變數不是裝資料的盒子，而是貼在記憶體物件上的標籤',
    conceptFocus: 'b = a 只是新增第二張標籤指向同一個 list；使用 .copy() 才會配置新物件。',
    code: `a = [10, 20]
b = a
b.append(30)
c = a.copy()
c.append(99)
print("a 與 b 同一物件:", a is b)
print("a 與 c 同一物件:", a is c)
print("a =", a, "| c =", c)`
  },
  {
    id: 'class_instance',
    title: '02. 類別藍圖與 self',
    subtitle: 'class 定義共用規格，每次呼叫建立獨立的實例記憶體空間',
    conceptFocus: '類別屬性 shop 由所有實例共享；self.item 與 self.price 屬於個別實例。',
    code: `class CoffeeOrder:
    shop = "台北烘焙所"

    def __init__(self, item, price):
        self.item = item
        self.price = price

    def upgrade_large(self):
        self.price += 20
        return f"{self.item} 升級大杯 ({self.price}元)"

order1 = CoffeeOrder("美式咖啡", 90)
order2 = CoffeeOrder("拿鐵咖啡", 120)
print(order1.upgrade_large())
print(order2.shop, order2.item, order2.price)`
  },
  {
    id: 'inheritance',
    title: '03. 繼承與 super()',
    subtitle: '子類別重複使用父類別建構邏輯，並覆寫或擴充專屬行為',
    conceptFocus: 'super().__init__(name, hp) 沿用父類別屬性初始化，再新增專屬的 mp 屬性。',
    code: `class Character:
    def __init__(self, name, hp):
        self.name = name
        self.hp = hp

    def status(self):
        return f"{self.name} HP:{self.hp}"

class Mage(Character):
    def __init__(self, name, hp, mp):
        super().__init__(name, hp)
        self.mp = mp

    def cast_spell(self):
        self.mp -= 15
        return f"{self.name} 施放法術！剩餘 MP:{self.mp}"

hero = Mage("艾莉絲", 100, 80)
print(hero.status())
print(hero.cast_spell())
print("是否為 Character:", isinstance(hero, Character))`
  },
  {
    id: 'polymorphism',
    title: '04. 鴨子型別與多型',
    subtitle: '不同類別只要實作同名方法，即可被統一介面操作',
    conceptFocus: '迴圈不需判斷型別，直接呼叫 pet.speak()，Python 會在執行期動態分派方法。',
    code: `class Dog:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return f"{self.name}: 汪汪！"

class Cat:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return f"{self.name}: 喵嗚~"

class Robot:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return f"{self.name}: 嗶嗶！"

pets = [Dog("柴犬"), Cat("橘貓"), Robot("RX-78")]
for p in pets:
    print(p.speak())`
  }
];

export const CHALLENGES: CodingChallenge[] = [
  {
    id: 'challenge-book',
    number: '01',
    title: '建立 Book 類別與實例方法',
    difficulty: '基礎',
    summary: '設計一個書籍藍圖，儲存書名與頁數，並提供閱讀進度摘要方法。',
    requirements: [
      '定義 class Book，__init__(self, title, pages) 設定 self.title 與 self.pages',
      '定義方法 summary(self)，回傳字串格式："{title}（共 {pages} 頁）"'
    ],
    starterCode: `class Book:
    def __init__(self, title, pages):
        # 請在此設定 self.title 與 self.pages
        pass

    def summary(self):
        # 請回傳 f"{self.title}（共 {self.pages} 頁）"
        pass
`,
    hint: '在 __init__ 中使用 self.title = title 與 self.pages = pages；在 summary 中使用 return f"{self.title}（共 {self.pages} 頁）"。',
    solutionCode: `class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages

    def summary(self):
        return f"{self.title}（共 {self.pages} 頁）"
`,
    tests: [
      {
        description: '建立實例並讀取屬性 title 與 pages',
        checkCode: `b = Book("Python 物件導向", 320)\nprint(b.title, b.pages)`,
        expectedStdout: 'Python 物件導向 320'
      },
      {
        description: '呼叫 summary() 回傳正確格式字串',
        checkCode: `b = Book("流暢的 Python", 580)\nprint(b.summary())`,
        expectedStdout: '流暢的 Python（共 580 頁）'
      }
    ]
  },
  {
    id: 'challenge-account',
    number: '02',
    title: '封裝保護與帳戶狀態驗證',
    difficulty: '基礎',
    summary: '為銀行帳戶加入狀態驗證，確保存款與提款不會讓餘額出現不合理數值。',
    requirements: [
      '定義 class BankAccount，__init__(self, owner, balance=0) 設定 self.owner 與 self.balance',
      '定義 deposit(self, amount)：當 amount > 0 時增加 self.balance，否則不變',
      '定義 withdraw(self, amount)：若 amount <= self.balance 則扣除並回傳 True，否則不扣款並回傳 False'
    ],
    starterCode: `class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        # 只有 amount > 0 才加到 self.balance
        pass

    def withdraw(self, amount):
        # 足夠時扣款並回傳 True，不足時回傳 False
        pass
`,
    hint: '在 withdraw 中先用 if amount <= self.balance: 判斷，扣款後 return True，else 分支 return False。',
    solutionCode: `class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount > 0:
            self.balance += amount

    def withdraw(self, amount):
        if amount <= self.balance:
            self.balance -= amount
            return True
        return False
`,
    tests: [
      {
        description: '正常存款與忽略負數存款',
        checkCode: `acc = BankAccount("小華", 100)\nacc.deposit(50)\nacc.deposit(-20)\nprint(acc.balance)`,
        expectedStdout: '150'
      },
      {
        description: '提款驗證：餘額足夠回傳 True，不足回傳 False 且餘額不變',
        checkCode: `acc = BankAccount("小華", 100)\nr1 = acc.withdraw(40)\nr2 = acc.withdraw(90)\nprint(r1, r2, acc.balance)`,
        expectedStdout: 'True False 60'
      }
    ]
  },
  {
    id: 'challenge-inherit',
    number: '03',
    title: '繼承 Vehicle 並使用 super()',
    difficulty: '進階',
    summary: '透過繼承重用父類別屬性，並在電動車子類別擴充電池電量與覆寫描述方法。',
    requirements: [
      '保留父類別 Vehicle(brand, speed)',
      '定義子類別 ElectricCar(Vehicle)，__init__(self, brand, speed, battery) 呼叫 super().__init__(brand, speed) 並設定 self.battery',
      '覆寫 describe(self) 回傳 "{brand} · 時速 {speed} km/h · 電量 {battery}%"'
    ],
    starterCode: `class Vehicle:
    def __init__(self, brand, speed):
        self.brand = brand
        self.speed = speed

    def describe(self):
        return f"{self.brand} · 時速 {self.speed} km/h"

class ElectricCar(Vehicle):
    def __init__(self, brand, speed, battery):
        # 請呼叫 super().__init__(brand, speed) 並設定 self.battery
        pass

    def describe(self):
        # 請回傳 "{self.brand} · 時速 {self.speed} km/h · 電量 {self.battery}%"
        pass
`,
    hint: '使用 super().__init__(brand, speed) 初始化 brand 與 speed，再補上 self.battery = battery。',
    solutionCode: `class Vehicle:
    def __init__(self, brand, speed):
        self.brand = brand
        self.speed = speed

    def describe(self):
        return f"{self.brand} · 時速 {self.speed} km/h"

class ElectricCar(Vehicle):
    def __init__(self, brand, speed, battery):
        super().__init__(brand, speed)
        self.battery = battery

    def describe(self):
        return f"{self.brand} · 時速 {self.speed} km/h · 電量 {self.battery}%"
`,
    tests: [
      {
        description: 'ElectricCar 同時屬於 Vehicle 子類別並繼承屬性',
        checkCode: `ev = ElectricCar("Model Y", 120, 85)\nprint(isinstance(ev, Vehicle), ev.brand, ev.battery)`,
        expectedStdout: 'True Model Y 85'
      },
      {
        description: '覆寫後的 describe() 正確顯示完整資訊',
        checkCode: `ev = ElectricCar("Model Y", 120, 85)\nprint(ev.describe())`,
        expectedStdout: 'Model Y · 時速 120 km/h · 電量 85%'
      }
    ]
  },
  {
    id: 'challenge-dunder',
    number: '04',
    title: '魔術方法：讓 Vector2D 支援加法與輸出',
    difficulty: '實戰',
    summary: '透過 __add__ 與 __str__，讓自訂物件像內建數字一樣自然相加並印出可讀文字。',
    requirements: [
      '定義 class Vector2D，__init__(self, x, y) 設定座標',
      '實作 __add__(self, other) 回傳新的 Vector2D(self.x + other.x, self.y + other.y)',
      '實作 __str__(self) 回傳 "Vector2D({self.x}, {self.y})"'
    ],
    starterCode: `class Vector2D:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        # 回傳新的 Vector2D 物件
        pass

    def __str__(self):
        # 回傳 "Vector2D(x, y)"
        pass
`,
    hint: '在 __add__ 中寫 return Vector2D(self.x + other.x, self.y + other.y)；__str__ 回傳 f"Vector2D({self.x}, {self.y})"。',
    solutionCode: `class Vector2D:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Vector2D(self.x + other.x, self.y + other.y)

    def __str__(self):
        return f"Vector2D({self.x}, {self.y})"
`,
    tests: [
      {
        description: 'v1 + v2 產生新 Vector2D 實例且不改變原本物件',
        checkCode: `v1 = Vector2D(2, 3)\nv2 = Vector2D(4, 5)\nv3 = v1 + v2\nprint(v3.x, v3.y, v1.x)`,
        expectedStdout: '6 8 2'
      },
      {
        description: 'print(v3) 觸發 __str__ 輸出可讀格式',
        checkCode: `v1 = Vector2D(1, 7)\nv2 = Vector2D(3, 2)\nprint(v1 + v2)`,
        expectedStdout: 'Vector2D(4, 9)'
      }
    ]
  }
];

export const PITFALLS: PitfallItem[] = [
  {
    id: 'missing-self',
    title: '01. 忘記在方法的第一個參數寫上 self',
    errorType: 'TypeError · 方法綁定失敗',
    symptom: '呼叫 dog.bark() 時，Python 會自動把實例本身作為第一個引數傳入，導致參數數量不符。',
    wrongCode: `class Dog:
    def bark():
        return "汪！"

d = Dog()
d.bark()  # TypeError: takes 0 positional arguments`,
    rightCode: `class Dog:
    def bark(self):
        return "汪！"

d = Dog()
d.bark()  # "汪！"`,
    why: 'Python 的方法其實就是定義在 class 裡的函式；透過實例呼叫時，實例會自動綁定到第一個參數（慣例命名為 self）。'
  },
  {
    id: 'mutable-default',
    title: '02. 在 __init__ 使用可變串列 [] 作為預設參數',
    errorType: '邏輯陷阱 · 跨實例資料汙染',
    symptom: '所有沒有傳入清單的實例會意外共用同一個 list 物件，修改甲的資料卻連乙一起被改掉。',
    wrongCode: `class Cart:
    def __init__(self, items=[]):
        self.items = items

c1 = Cart()
c2 = Cart()
c1.items.append("鍵盤")
print(c2.items)  # ['鍵盤'] 意外被改動！`,
    rightCode: `class Cart:
    def __init__(self, items=None):
        self.items = [] if items is None else items

c1 = Cart()
c2 = Cart()
c1.items.append("鍵盤")
print(c2.items)  # [] 完全獨立`,
    why: 'Python 函式的預設參數只在定義 def 時建立一次，不會在每次呼叫時重新產生；使用 None 並在函式內新建串列才安全。'
  },
  {
    id: 'is-vs-eq',
    title: '03. 混淆 is（身分同一性）與 ==（值相等）',
    errorType: '比較誤用 · 記憶體與內容差異',
    symptom: '兩個內容相同的 list 或自訂物件，用 is 比較會是 False，因為它們位於不同的記憶體位址。',
    wrongCode: `a = [1, 2, 3]
b = [1, 2, 3]
print(a is b)  # False (位址不同，誤判為不相等)`,
    rightCode: `a = [1, 2, 3]
b = [1, 2, 3]
print(a == b)      # True  (內容相等)
print(a is None)   # 僅在檢查 None 時使用 is`,
    why: '== 比較的是兩個物件的值（可透過 __eq__ 自訂），is 比較的是 id(a) == id(b)，即是否指向記憶體中的同一個物件。'
  }
];
