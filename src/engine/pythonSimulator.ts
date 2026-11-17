export interface MemoryVar {
  name: string;
  objectId: string;
  changed?: boolean;
}

export interface MemoryAttrEntry {
  display: string;
  targetId?: string;
  changed?: boolean;
}

export interface MemoryObject {
  id: string;
  address: string;
  typeName: string;
  kind: 'instance' | 'list' | 'dict' | 'primitive';
  displayValue: string;
  attrs: Record<string, MemoryAttrEntry>;
  listItems?: { display: string; targetId?: string }[];
  refCount: number;
  isNew?: boolean;
  isMutated?: boolean;
}

export interface ClassBlueprintSnapshot {
  name: string;
  bases: string[];
  classAttrs: Record<string, string>;
  methods: string[];
  properties: string[];
}

export interface ExecutionStep {
  stepIndex: number;
  lineNumber: number;
  lineText: string;
  explanation: string;
  callStack: string[];
  variables: MemoryVar[];
  classes: ClassBlueprintSnapshot[];
  objects: MemoryObject[];
  stdout: string[];
  error?: string;
}

export interface SimulationResult {
  steps: ExecutionStep[];
  stdout: string[];
  error?: string;
  finalEnv: {
    variables: Record<string, PyVal>;
    classes: Record<string, PyClass>;
  };
}

// --- Internal Python Value Types ---

export type PyVal =
  | { kind: 'none'; id: string }
  | { kind: 'bool'; value: boolean; id: string }
  | { kind: 'number'; value: number; id: string }
  | { kind: 'string'; value: string; id: string }
  | { kind: 'list'; items: PyVal[]; id: string }
  | { kind: 'dict'; entries: Map<string, PyVal>; id: string }
  | { kind: 'instance'; classRef: PyClass; attrs: Record<string, PyVal>; id: string }
  | { kind: 'class'; classRef: PyClass; id: string }
  | { kind: 'function'; funcRef: PyFunc; id: string };

export interface PyFunc {
  name: string;
  params: string[];
  body: AstNode[];
  isProperty?: boolean;
  isSetterFor?: string;
  definingClass?: string;
}

export interface PyClass {
  name: string;
  bases: PyClass[];
  classAttrs: Record<string, PyVal>;
  methods: Record<string, PyFunc>;
  properties: Record<string, { getter?: PyFunc; setter?: PyFunc }>;
  id: string;
}

// --- AST Nodes ---

type AstNode =
  | { type: 'class'; name: string; baseNames: string[]; body: AstNode[]; line: number }
  | { type: 'def'; name: string; params: string[]; body: AstNode[]; decorators: string[]; line: number }
  | { type: 'assign'; target: ExprNode; op: '=' | '+=' | '-='; value: ExprNode; line: number }
  | { type: 'return'; value: ExprNode | null; line: number }
  | { type: 'if'; branches: { cond: ExprNode | null; body: AstNode[] }[]; line: number }
  | { type: 'for'; varName: string; iter: ExprNode; body: AstNode[]; line: number }
  | { type: 'try'; tryBody: AstNode[]; exceptVar?: string; exceptType?: string; exceptBody: AstNode[]; line: number }
  | { type: 'raise'; expr: ExprNode; line: number }
  | { type: 'expr'; expr: ExprNode; line: number };

type ExprNode =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'fstring'; raw: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'none' }
  | { kind: 'ident'; name: string }
  | { kind: 'list'; elements: ExprNode[] }
  | { kind: 'dict'; pairs: { key: ExprNode; val: ExprNode }[] }
  | { kind: 'attr'; obj: ExprNode; attr: string }
  | { kind: 'index'; obj: ExprNode; index: ExprNode }
  | { kind: 'call'; callee: ExprNode; args: { name?: string; value: ExprNode }[] }
  | { kind: 'unary'; op: string; right: ExprNode }
  | { kind: 'binary'; op: string; left: ExprNode; right: ExprNode };

// --- Tokenization for Expressions ---

interface Token {
  type: 'num' | 'str' | 'fstr' | 'ident' | 'op' | 'punc';
  val: string;
}

function tokenizeExpr(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '#') break;

    // f-string
    if ((ch === 'f' || ch === 'F') && (input[i + 1] === '"' || input[i + 1] === "'")) {
      const quote = input[i + 1];
      i += 2;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          str += input[i + 1] === 'n' ? '\n' : input[i + 1];
          i += 2;
        } else {
          str += input[i];
          i++;
        }
      }
      i++;
      tokens.push({ type: 'fstr', val: str });
      continue;
    }

    // String
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          str += input[i + 1] === 'n' ? '\n' : input[i + 1];
          i += 2;
        } else {
          str += input[i];
          i++;
        }
      }
      i++;
      tokens.push({ type: 'str', val: str });
      continue;
    }

    // Number
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(input[i + 1] || ''))) {
      let numStr = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        numStr += input[i++];
      }
      tokens.push({ type: 'num', val: numStr });
      continue;
    }

    // Identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      let id = '';
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) {
        id += input[i++];
      }
      tokens.push({ type: 'ident', val: id });
      continue;
    }

    // Multi-char operators
    const two = input.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '//', '**', '+=', '-='].includes(two)) {
      tokens.push({ type: 'op', val: two });
      i += 2;
      continue;
    }

    if ('+-*/%<>='.includes(ch)) {
      tokens.push({ type: 'op', val: ch });
      i++;
      continue;
    }

    if ('()[]{},:.'.includes(ch)) {
      tokens.push({ type: 'punc', val: ch });
      i++;
      continue;
    }

    throw new SyntaxError(`無法辨識的字元 '${ch}'`);
  }
  return tokens;
}

class ExprParser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.pos + offset];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  parse(): ExprNode {
    if (this.tokens.length === 0) {
      return { kind: 'none' };
    }
    return this.parseOr();
  }

  private parseOr(): ExprNode {
    let left = this.parseAnd();
    while (this.peek()?.type === 'ident' && this.peek()?.val === 'or') {
      this.consume();
      const right = this.parseAnd();
      left = { kind: 'binary', op: 'or', left, right };
    }
    return left;
  }

  private parseAnd(): ExprNode {
    let left = this.parseNot();
    while (this.peek()?.type === 'ident' && this.peek()?.val === 'and') {
      this.consume();
      const right = this.parseNot();
      left = { kind: 'binary', op: 'and', left, right };
    }
    return left;
  }

  private parseNot(): ExprNode {
    if (this.peek()?.type === 'ident' && this.peek()?.val === 'not') {
      this.consume();
      return { kind: 'unary', op: 'not', right: this.parseNot() };
    }
    return this.parseComparison();
  }

  private parseComparison(): ExprNode {
    let left = this.parseAddSub();
    while (true) {
      const t = this.peek();
      if (!t) break;
      if (t.type === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(t.val)) {
        this.consume();
        left = { kind: 'binary', op: t.val, left, right: this.parseAddSub() };
      } else if (t.type === 'ident' && t.val === 'is') {
        this.consume();
        if (this.peek()?.type === 'ident' && this.peek()?.val === 'not') {
          this.consume();
          left = { kind: 'binary', op: 'is not', left, right: this.parseAddSub() };
        } else {
          left = { kind: 'binary', op: 'is', left, right: this.parseAddSub() };
        }
      } else if (t.type === 'ident' && t.val === 'in') {
        this.consume();
        left = { kind: 'binary', op: 'in', left, right: this.parseAddSub() };
      } else {
        break;
      }
    }
    return left;
  }

  private parseAddSub(): ExprNode {
    let left = this.parseMulDiv();
    while (this.peek()?.type === 'op' && (this.peek()?.val === '+' || this.peek()?.val === '-')) {
      const op = this.consume().val;
      left = { kind: 'binary', op, left, right: this.parseMulDiv() };
    }
    return left;
  }

  private parseMulDiv(): ExprNode {
    let left = this.parseUnary();
    while (this.peek()?.type === 'op' && ['*', '/', '//', '%', '**'].includes(this.peek()!.val)) {
      const op = this.consume().val;
      left = { kind: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): ExprNode {
    if (this.peek()?.type === 'op' && (this.peek()?.val === '-' || this.peek()?.val === '+')) {
      const op = this.consume().val;
      return { kind: 'unary', op, right: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): ExprNode {
    let expr = this.parsePrimary();
    while (true) {
      const t = this.peek();
      if (!t) break;
      if (t.type === 'punc' && t.val === '.') {
        this.consume();
        const attrTok = this.consume();
        if (!attrTok || attrTok.type !== 'ident') {
          throw new SyntaxError('預期屬性名稱');
        }
        expr = { kind: 'attr', obj: expr, attr: attrTok.val };
      } else if (t.type === 'punc' && t.val === '(') {
        this.consume();
        const args: { name?: string; value: ExprNode }[] = [];
        while (this.peek() && !(this.peek()!.type === 'punc' && this.peek()!.val === ')')) {
          if (
            this.peek()?.type === 'ident' &&
            this.peek(1)?.type === 'op' &&
            this.peek(1)?.val === '='
          ) {
            const kwName = this.consume().val;
            this.consume(); // =
            args.push({ name: kwName, value: this.parseOr() });
          } else {
            args.push({ value: this.parseOr() });
          }
          if (this.peek()?.type === 'punc' && this.peek()?.val === ',') {
            this.consume();
          } else {
            break;
          }
        }
        if (this.peek()?.type !== 'punc' || this.peek()?.val !== ')') {
          throw new SyntaxError('函式呼叫缺少右括號 )');
        }
        this.consume();
        expr = { kind: 'call', callee: expr, args };
      } else if (t.type === 'punc' && t.val === '[') {
        this.consume();
        const index = this.parseOr();
        if (this.peek()?.type !== 'punc' || this.peek()?.val !== ']') {
          throw new SyntaxError('索引缺少右括號 ]');
        }
        this.consume();
        expr = { kind: 'index', obj: expr, index };
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimary(): ExprNode {
    const t = this.consume();
    if (!t) throw new SyntaxError('預期運算式');

    if (t.type === 'num') return { kind: 'number', value: Number(t.val) };
    if (t.type === 'str') return { kind: 'string', value: t.val };
    if (t.type === 'fstr') return { kind: 'fstring', raw: t.val };
    if (t.type === 'ident') {
      if (t.val === 'True') return { kind: 'bool', value: true };
      if (t.val === 'False') return { kind: 'bool', value: false };
      if (t.val === 'None') return { kind: 'none' };
      return { kind: 'ident', name: t.val };
    }
    if (t.type === 'punc' && t.val === '(') {
      const inner = this.parseOr();
      if (this.peek()?.type === 'punc' && this.peek()?.val === ')') this.consume();
      return inner;
    }
    if (t.type === 'punc' && t.val === '[') {
      const elements: ExprNode[] = [];
      while (this.peek() && !(this.peek()!.type === 'punc' && this.peek()!.val === ']')) {
        elements.push(this.parseOr());
        if (this.peek()?.type === 'punc' && this.peek()?.val === ',') this.consume();
        else break;
      }
      if (this.peek()?.type === 'punc' && this.peek()?.val === ']') this.consume();
      return { kind: 'list', elements };
    }
    if (t.type === 'punc' && t.val === '{') {
      const pairs: { key: ExprNode; val: ExprNode }[] = [];
      while (this.peek() && !(this.peek()!.type === 'punc' && this.peek()!.val === '}')) {
        const key = this.parseOr();
        if (this.peek()?.type === 'punc' && this.peek()?.val === ':') this.consume();
        const val = this.parseOr();
        pairs.push({ key, val });
        if (this.peek()?.type === 'punc' && this.peek()?.val === ',') this.consume();
        else break;
      }
      if (this.peek()?.type === 'punc' && this.peek()?.val === '}') this.consume();
      return { kind: 'dict', pairs };
    }

    throw new SyntaxError(`未預期的標記 '${t.val}'`);
  }
}

function parseExpression(code: string): ExprNode {
  return new ExprParser(tokenizeExpr(code)).parse();
}

function stripInlineComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) return line.slice(0, i);
  }
  return line;
}

// Split assignment outside brackets/quotes
function findAssignmentOp(line: string): { idx: number; op: '=' | '+=' | '-=' } | null {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
      else if (depth === 0) {
        if (line.slice(i, i + 2) === '+=') return { idx: i, op: '+=' };
        if (line.slice(i, i + 2) === '-=') return { idx: i, op: '-=' };
        if (
          ch === '=' &&
          line[i - 1] !== '=' &&
          line[i - 1] !== '!' &&
          line[i - 1] !== '<' &&
          line[i - 1] !== '>' &&
          line[i + 1] !== '='
        ) {
          return { idx: i, op: '=' };
        }
      }
    }
  }
  return null;
}

interface SourceLine {
  lineNumber: number;
  indent: number;
  text: string;
  raw: string;
}

function preprocessLines(code: string): SourceLine[] {
  const rawLines = code.split(/\r?\n/);
  const result: SourceLine[] = [];
  rawLines.forEach((raw, idx) => {
    const noComment = stripInlineComment(raw);
    const trimmed = noComment.trim();
    if (!trimmed) return;
    const indentMatch = noComment.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].replace(/\t/g, '    ').length : 0;
    result.push({ lineNumber: idx + 1, indent, text: trimmed, raw });
  });
  return result;
}

function parseBlock(lines: SourceLine[], startIdx: number, expectedIndent: number): { nodes: AstNode[]; nextIdx: number } {
  const nodes: AstNode[] = [];
  let i = startIdx;
  let pendingDecorators: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    if (line.indent < expectedIndent) break;
    if (line.indent > expectedIndent) {
      throw new SyntaxError(`第 ${line.lineNumber} 行縮排錯誤：未預期的縮排`);
    }

    const txt = line.text;

    if (txt.startsWith('@')) {
      pendingDecorators.push(txt.slice(1).trim());
      i++;
      continue;
    }

    if (txt.startsWith('class ')) {
      const m = txt.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(([^)]*)\))?\s*:$/);
      if (!m) throw new SyntaxError(`第 ${line.lineNumber} 行 class 語法錯誤`);
      const name = m[1];
      const baseNames = m[2]
        ? m[2].split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      i++;
      const childIndent = i < lines.length ? lines[i].indent : expectedIndent + 4;
      if (childIndent <= expectedIndent) {
        throw new SyntaxError(`第 ${line.lineNumber} 行 class 後方需要縮排區塊`);
      }
      const { nodes: body, nextIdx } = parseBlock(lines, i, childIndent);
      nodes.push({ type: 'class', name, baseNames, body, line: line.lineNumber });
      i = nextIdx;
      pendingDecorators = [];
      continue;
    }

    if (txt.startsWith('def ')) {
      const m = txt.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:->[^:]+)?\s*:$/);
      if (!m) throw new SyntaxError(`第 ${line.lineNumber} 行 def 語法錯誤`);
      const name = m[1];
      const params = m[2]
        ? m[2].split(',').map((p) => p.trim().split('=')[0].split(':')[0].trim()).filter(Boolean)
        : [];
      const decs = [...pendingDecorators];
      pendingDecorators = [];
      i++;
      const childIndent = i < lines.length ? lines[i].indent : expectedIndent + 4;
      if (childIndent <= expectedIndent) {
        throw new SyntaxError(`第 ${line.lineNumber} 行 def 後方需要縮排區塊`);
      }
      const { nodes: body, nextIdx } = parseBlock(lines, i, childIndent);
      nodes.push({ type: 'def', name, params, body, decorators: decs, line: line.lineNumber });
      i = nextIdx;
      continue;
    }

    pendingDecorators = [];

    if (txt.startsWith('if ')) {
      const branches: { cond: ExprNode | null; body: AstNode[] }[] = [];
      const condStr = txt.slice(3, -1).trim();
      if (!txt.endsWith(':')) throw new SyntaxError(`第 ${line.lineNumber} 行 if 缺少冒號 :`);
      i++;
      const childIndent = i < lines.length ? lines[i].indent : expectedIndent + 4;
      const ifBlock = parseBlock(lines, i, childIndent);
      branches.push({ cond: parseExpression(condStr), body: ifBlock.nodes });
      i = ifBlock.nextIdx;

      while (i < lines.length && lines[i].indent === expectedIndent) {
        const nextTxt = lines[i].text;
        if (nextTxt.startsWith('elif ')) {
          if (!nextTxt.endsWith(':')) throw new SyntaxError(`第 ${lines[i].lineNumber} 行 elif 缺少冒號 :`);
          const elifCond = nextTxt.slice(5, -1).trim();
          i++;
          const cIndent = i < lines.length ? lines[i].indent : expectedIndent + 4;
          const elifBlock = parseBlock(lines, i, cIndent);
          branches.push({ cond: parseExpression(elifCond), body: elifBlock.nodes });
          i = elifBlock.nextIdx;
        } else if (nextTxt === 'else:') {
          i++;
          const cIndent = i < lines.length ? lines[i].indent : expectedIndent + 4;
          const elseBlock = parseBlock(lines, i, cIndent);
          branches.push({ cond: null, body: elseBlock.nodes });
          i = elseBlock.nextIdx;
          break;
        } else {
          break;
        }
      }
      nodes.push({ type: 'if', branches, line: line.lineNumber });
      continue;
    }

    if (txt.startsWith('for ')) {
      const m = txt.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+):$/);
      if (!m) throw new SyntaxError(`第 ${line.lineNumber} 行 for 迴圈語法錯誤`);
      i++;
      const childIndent = i < lines.length ? lines[i].indent : expectedIndent + 4;
      const { nodes: body, nextIdx } = parseBlock(lines, i, childIndent);
      nodes.push({ type: 'for', varName: m[1], iter: parseExpression(m[2]), body, line: line.lineNumber });
      i = nextIdx;
      continue;
    }

    if (txt === 'try:') {
      i++;
      const childIndent = i < lines.length ? lines[i].indent : expectedIndent + 4;
      const tryBlock = parseBlock(lines, i, childIndent);
      i = tryBlock.nextIdx;
      let exceptVar: string | undefined;
      let exceptType: string | undefined;
      let exceptBody: AstNode[] = [];
      if (i < lines.length && lines[i].indent === expectedIndent && lines[i].text.startsWith('except')) {
        const em = lines[i].text.match(/^except(?:\s+([A-Za-z_][A-Za-z0-9_]*))?(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?\s*:$/);
        if (em) {
          exceptType = em[1];
          exceptVar = em[2];
        }
        i++;
        const eIndent = i < lines.length ? lines[i].indent : expectedIndent + 4;
        const eBlock = parseBlock(lines, i, eIndent);
        exceptBody = eBlock.nodes;
        i = eBlock.nextIdx;
      }
      nodes.push({ type: 'try', tryBody: tryBlock.nodes, exceptType, exceptVar, exceptBody, line: line.lineNumber });
      continue;
    }

    if (txt === 'pass') {
      i++;
      continue;
    }

    if (txt === 'return' || txt.startsWith('return ')) {
      const valStr = txt.slice(6).trim();
      nodes.push({
        type: 'return',
        value: valStr ? parseExpression(valStr) : null,
        line: line.lineNumber,
      });
      i++;
      continue;
    }

    if (txt.startsWith('raise ')) {
      nodes.push({
        type: 'raise',
        expr: parseExpression(txt.slice(6).trim()),
        line: line.lineNumber,
      });
      i++;
      continue;
    }

    const assignOp = findAssignmentOp(txt);
    if (assignOp) {
      const lhs = txt.slice(0, assignOp.idx).trim();
      const rhs = txt.slice(assignOp.idx + assignOp.op.length).trim();
      nodes.push({
        type: 'assign',
        target: parseExpression(lhs),
        op: assignOp.op,
        value: parseExpression(rhs),
        line: line.lineNumber,
      });
      i++;
      continue;
    }

    nodes.push({ type: 'expr', expr: parseExpression(txt), line: line.lineNumber });
    i++;
  }

  return { nodes, nextIdx: i };
}

// --- Runtime Engine ---

class ReturnSignal {
  constructor(public value: PyVal) {}
}

class PyRuntimeError extends Error {
  constructor(public pyType: string, message: string) {
    super(`${pyType}: ${message}`);
  }
}

export function simulatePythonCode(code: string, maxSteps = 120): SimulationResult {
  const rawCodeLines = code.split(/\r?\n/);
  const steps: ExecutionStep[] = [];
  const stdout: string[] = [];
  let addrCounter = 0x1000;
  let idCounter = 1;

  const nextId = () => `obj_${idCounter++}`;
  const nextAddress = () => {
    addrCounter += 0x18;
    return `0x${addrCounter.toString(16).toUpperCase()}`;
  };

  // Interned address map per PyVal id
  const addrMap = new Map<string, string>();
  const getAddr = (id: string) => {
    let a = addrMap.get(id);
    if (!a) {
      a = nextAddress();
      addrMap.set(id, a);
    }
    return a;
  };

  const makeNone = (): PyVal => ({ kind: 'none', id: 'const_none' });
  const makeBool = (v: boolean): PyVal => ({ kind: 'bool', value: v, id: v ? 'const_true' : 'const_false' });
  const makeNum = (v: number): PyVal => ({ kind: 'number', value: v, id: nextId() });
  const makeStr = (v: string): PyVal => ({ kind: 'string', value: v, id: nextId() });
  const makeList = (items: PyVal[]): PyVal => ({ kind: 'list', items, id: nextId() });
  const makeDict = (entries: Map<string, PyVal>): PyVal => ({ kind: 'dict', entries, id: nextId() });

  const globalScope: Record<string, PyVal> = {};
  const classRegistry: Record<string, PyClass> = {};
  const callStack: string[] = ['<module>'];
  const changedVarNames = new Set<string>();
  const newObjectIds = new Set<string>();
  const mutatedObjectIds = new Set<string>();

  function getMro(cls: PyClass): PyClass[] {
    const visited = new Set<PyClass>();
    const order: PyClass[] = [];
    const dfs = (c: PyClass) => {
      if (visited.has(c)) return;
      visited.add(c);
      order.push(c);
      for (const b of c.bases) dfs(b);
    };
    dfs(cls);
    return order;
  }

  function resolveMethod(cls: PyClass, name: string, startAfter?: PyClass): { fn: PyFunc; owner: PyClass } | null {
    const mro = getMro(cls);
    let started = !startAfter;
    for (const c of mro) {
      if (!started) {
        if (c === startAfter) started = true;
        continue;
      }
      if (c.methods[name]) return { fn: c.methods[name], owner: c };
    }
    return null;
  }

  function resolveProperty(cls: PyClass, name: string): { getter?: PyFunc; setter?: PyFunc } | null {
    for (const c of getMro(cls)) {
      if (c.properties[name]) return c.properties[name];
    }
    return null;
  }

  function resolveClassAttr(cls: PyClass, name: string): PyVal | undefined {
    for (const c of getMro(cls)) {
      if (name in c.classAttrs) return c.classAttrs[name];
    }
    return undefined;
  }

  function isTruthy(val: PyVal): boolean {
    if (val.kind === 'none') return false;
    if (val.kind === 'bool') return val.value;
    if (val.kind === 'number') return val.value !== 0;
    if (val.kind === 'string') return val.value.length > 0;
    if (val.kind === 'list') return val.items.length > 0;
    if (val.kind === 'dict') return val.entries.size > 0;
    return true;
  }

  function formatPyVal(val: PyVal, useRepr = false): string {
    switch (val.kind) {
      case 'none':
        return 'None';
      case 'bool':
        return val.value ? 'True' : 'False';
      case 'number':
        return String(val.value);
      case 'string':
        return useRepr ? `"${val.value}"` : val.value;
      case 'list':
        return `[${val.items.map((x) => formatPyVal(x, true)).join(', ')}]`;
      case 'dict': {
        const parts: string[] = [];
        val.entries.forEach((v, k) => parts.push(`"${k}": ${formatPyVal(v, true)}`));
        return `{${parts.join(', ')}}`;
      }
      case 'class':
        return `<class '${val.classRef.name}'>`;
      case 'function':
        return `<function ${val.funcRef.name}>`;
      case 'instance': {
        const strMethod = resolveMethod(val.classRef, '__str__');
        if (!useRepr && strMethod) {
          try {
            const res = invokeFunction(strMethod.fn, [val], {}, strMethod.owner);
            return formatPyVal(res, false);
          } catch {
            // fallback
          }
        }
        const reprMethod = resolveMethod(val.classRef, '__repr__');
        if (reprMethod) {
          try {
            const res = invokeFunction(reprMethod.fn, [val], {}, reprMethod.owner);
            return formatPyVal(res, false);
          } catch {
            // fallback
          }
        }
        return `<${val.classRef.name} 物件 @ ${getAddr(val.id)}>`;
      }
    }
  }

  function recordStep(lineNumber: number, explanation: string, error?: string) {
    if (steps.length >= maxSteps) return;

    // Collect reachable heap objects from globalScope (prioritizing instances, lists, dicts, and referenced primitives)
    const objMap = new Map<string, PyVal>();
    const refCounts = new Map<string, number>();

    const registerVal = (v: PyVal, isDirectRef: boolean) => {
      getAddr(v.id);
      if (isDirectRef) {
        refCounts.set(v.id, (refCounts.get(v.id) || 0) + 1);
      }
      if (!objMap.has(v.id)) {
        objMap.set(v.id, v);
        if (v.kind === 'instance') {
          Object.values(v.attrs).forEach((attrVal) => registerVal(attrVal, attrVal.kind === 'list' || attrVal.kind === 'instance' || attrVal.kind === 'dict'));
        } else if (v.kind === 'list') {
          v.items.forEach((item) => registerVal(item, item.kind === 'list' || item.kind === 'instance'));
        }
      }
    };

    const variables: MemoryVar[] = [];
    Object.entries(globalScope).forEach(([name, val]) => {
      if (val.kind === 'class' || val.kind === 'function') return;
      registerVal(val, true);
      variables.push({
        name,
        objectId: val.id,
        changed: changedVarNames.has(name),
      });
    });

    const objects: MemoryObject[] = [];
    objMap.forEach((val) => {
      // Only render heap boxes for objects referenced by variables, or containers/instances
      if (
        val.kind === 'instance' ||
        val.kind === 'list' ||
        val.kind === 'dict' ||
        (refCounts.get(val.id) || 0) > 0
      ) {
        const attrs: Record<string, MemoryAttrEntry> = {};
        if (val.kind === 'instance') {
          Object.entries(val.attrs).forEach(([k, av]) => {
            attrs[k] = {
              display: formatPyVal(av, true),
              targetId: av.kind === 'instance' || av.kind === 'list' || av.kind === 'dict' ? av.id : undefined,
            };
          });
        }
        objects.push({
          id: val.id,
          address: getAddr(val.id),
          typeName:
            val.kind === 'instance'
              ? val.classRef.name
              : val.kind === 'list'
                ? 'list'
                : val.kind === 'dict'
                  ? 'dict'
                  : val.kind === 'number'
                    ? Number.isInteger(val.value)
                      ? 'int'
                      : 'float'
                    : val.kind === 'string'
                      ? 'str'
                      : val.kind === 'bool'
                        ? 'bool'
                        : 'NoneType',
          kind:
            val.kind === 'instance'
              ? 'instance'
              : val.kind === 'list'
                ? 'list'
                : val.kind === 'dict'
                  ? 'dict'
                  : 'primitive',
          displayValue:
            val.kind === 'instance'
              ? val.classRef.name
              : formatPyVal(val, true),
          attrs,
          listItems:
            val.kind === 'list'
              ? val.items.map((item) => ({
                  display: formatPyVal(item, true),
                  targetId: item.kind === 'instance' || item.kind === 'list' ? item.id : undefined,
                }))
              : undefined,
          refCount: refCounts.get(val.id) || 1,
          isNew: newObjectIds.has(val.id),
          isMutated: mutatedObjectIds.has(val.id),
        });
      }
    });

    const classes: ClassBlueprintSnapshot[] = Object.values(classRegistry).map((cls) => ({
      name: cls.name,
      bases: cls.bases.map((b) => b.name),
      classAttrs: Object.fromEntries(
        Object.entries(cls.classAttrs).map(([k, v]) => [k, formatPyVal(v, true)])
      ),
      methods: Object.keys(cls.methods),
      properties: Object.keys(cls.properties),
    }));

    steps.push({
      stepIndex: steps.length,
      lineNumber,
      lineText: rawCodeLines[lineNumber - 1]?.trim() || '',
      explanation,
      callStack: [...callStack],
      variables,
      classes,
      objects,
      stdout: [...stdout],
      error,
    });

    changedVarNames.clear();
    newObjectIds.clear();
    mutatedObjectIds.clear();
  }

  function invokeFunction(
    fn: PyFunc,
    positionalArgs: PyVal[],
    keywordArgs: Record<string, PyVal>,
    ownerClass?: PyClass,
    selfInstance?: PyVal
  ): PyVal {
    const localScope: Record<string, PyVal> = {};
    fn.params.forEach((param, idx) => {
      if (idx < positionalArgs.length) {
        localScope[param] = positionalArgs[idx];
      } else if (param in keywordArgs) {
        localScope[param] = keywordArgs[param];
      } else {
        localScope[param] = makeNone();
      }
    });

    const boundSelf = selfInstance || (positionalArgs[0]?.kind === 'instance' ? positionalArgs[0] : undefined);
    const frameLabel = ownerClass ? `${ownerClass.name}.${fn.name}()` : `${fn.name}()`;
    callStack.push(frameLabel);
    try {
      executeBlock(fn.body, localScope, {
        currentClass: ownerClass,
        selfInstance: boundSelf,
      });
    } catch (sig) {
      if (sig instanceof ReturnSignal) {
        callStack.pop();
        return sig.value;
      }
      callStack.pop();
      throw sig;
    }
    callStack.pop();
    return makeNone();
  }

  function evalExpr(
    expr: ExprNode,
    scope: Record<string, PyVal>,
    ctx: { currentClass?: PyClass; selfInstance?: PyVal }
  ): PyVal {
    switch (expr.kind) {
      case 'none':
        return makeNone();
      case 'bool':
        return makeBool(expr.value);
      case 'number':
        return makeNum(expr.value);
      case 'string':
        return makeStr(expr.value);
      case 'fstring': {
        const formatted = expr.raw.replace(/\{([^}]+)\}/g, (_, inner) => {
          const innerVal = evalExpr(parseExpression(inner.trim()), scope, ctx);
          return formatPyVal(innerVal, false);
        });
        return makeStr(formatted);
      }
      case 'list': {
        const items = expr.elements.map((e) => evalExpr(e, scope, ctx));
        const listVal = makeList(items);
        newObjectIds.add(listVal.id);
        return listVal;
      }
      case 'dict': {
        const entries = new Map<string, PyVal>();
        expr.pairs.forEach((p) => {
          const k = formatPyVal(evalExpr(p.key, scope, ctx), false);
          const v = evalExpr(p.val, scope, ctx);
          entries.set(k, v);
        });
        const dictVal = makeDict(entries);
        newObjectIds.add(dictVal.id);
        return dictVal;
      }
      case 'ident': {
        if (expr.name in scope) return scope[expr.name];
        if (expr.name in globalScope) return globalScope[expr.name];
        if (expr.name in classRegistry) {
          return { kind: 'class', classRef: classRegistry[expr.name], id: classRegistry[expr.name].id };
        }
        throw new PyRuntimeError('NameError', `未定義的名稱 '${expr.name}'`);
      }
      case 'unary': {
        const r = evalExpr(expr.right, scope, ctx);
        if (expr.op === 'not') return makeBool(!isTruthy(r));
        if (expr.op === '-' && r.kind === 'number') return makeNum(-r.value);
        if (expr.op === '+' && r.kind === 'number') return makeNum(+r.value);
        throw new PyRuntimeError('TypeError', `不支援的一元運算子 '${expr.op}'`);
      }
      case 'binary': {
        if (expr.op === 'and') {
          const l = evalExpr(expr.left, scope, ctx);
          return isTruthy(l) ? evalExpr(expr.right, scope, ctx) : l;
        }
        if (expr.op === 'or') {
          const l = evalExpr(expr.left, scope, ctx);
          return isTruthy(l) ? l : evalExpr(expr.right, scope, ctx);
        }
        const l = evalExpr(expr.left, scope, ctx);
        const r = evalExpr(expr.right, scope, ctx);

        if (expr.op === 'is') return makeBool(l.id === r.id);
        if (expr.op === 'is not') return makeBool(l.id !== r.id);

        if (expr.op === '+') {
          if (l.kind === 'instance') {
            const addFn = resolveMethod(l.classRef, '__add__');
            if (addFn) return invokeFunction(addFn.fn, [l, r], {}, addFn.owner, l);
          }
          if (l.kind === 'number' && r.kind === 'number') return makeNum(l.value + r.value);
          if (l.kind === 'string' && r.kind === 'string') return makeStr(l.value + r.value);
          if (l.kind === 'list' && r.kind === 'list') return makeList([...l.items, ...r.items]);
          throw new PyRuntimeError('TypeError', `無法將 ${l.kind} 與 ${r.kind} 相加`);
        }
        if (expr.op === '-' && l.kind === 'number' && r.kind === 'number') return makeNum(l.value - r.value);
        if (expr.op === '*') {
          if (l.kind === 'number' && r.kind === 'number') return makeNum(l.value * r.value);
          if (l.kind === 'string' && r.kind === 'number') return makeStr(l.value.repeat(Math.max(0, Math.floor(r.value))));
        }
        if (expr.op === '/' && l.kind === 'number' && r.kind === 'number') {
          if (r.value === 0) throw new PyRuntimeError('ZeroDivisionError', '除以零錯誤');
          return makeNum(l.value / r.value);
        }
        if (expr.op === '//' && l.kind === 'number' && r.kind === 'number') return makeNum(Math.floor(l.value / r.value));
        if (expr.op === '%' && l.kind === 'number' && r.kind === 'number') return makeNum(l.value % r.value);
        if (expr.op === '**' && l.kind === 'number' && r.kind === 'number') return makeNum(Math.pow(l.value, r.value));

        if (expr.op === '==') {
          if (l.kind === 'instance') {
            const eqFn = resolveMethod(l.classRef, '__eq__');
            if (eqFn) return invokeFunction(eqFn.fn, [l, r], {}, eqFn.owner, l);
          }
          if (l.kind === 'number' && r.kind === 'number') return makeBool(l.value === r.value);
          if (l.kind === 'string' && r.kind === 'string') return makeBool(l.value === r.value);
          if (l.kind === 'bool' && r.kind === 'bool') return makeBool(l.value === r.value);
          if (l.kind === 'none' && r.kind === 'none') return makeBool(true);
          if (l.kind === 'list' && r.kind === 'list') {
            return makeBool(
              l.items.length === r.items.length &&
                l.items.every((it, idx) => formatPyVal(it, true) === formatPyVal(r.items[idx], true))
            );
          }
          return makeBool(l.id === r.id);
        }
        if (expr.op === '!=') {
          const eq = evalExpr({ kind: 'binary', op: '==', left: expr.left, right: expr.right }, scope, ctx);
          return makeBool(!isTruthy(eq));
        }
        if (['<', '>', '<=', '>='].includes(expr.op) && l.kind === 'number' && r.kind === 'number') {
          if (expr.op === '<') return makeBool(l.value < r.value);
          if (expr.op === '>') return makeBool(l.value > r.value);
          if (expr.op === '<=') return makeBool(l.value <= r.value);
          return makeBool(l.value >= r.value);
        }
        if (expr.op === 'in') {
          if (r.kind === 'list') return makeBool(r.items.some((x) => formatPyVal(x, true) === formatPyVal(l, true)));
          if (r.kind === 'string' && l.kind === 'string') return makeBool(r.value.includes(l.value));
        }

        throw new PyRuntimeError('TypeError', `不支援的二元運算 '${expr.op}'`);
      }
      case 'index': {
        const obj = evalExpr(expr.obj, scope, ctx);
        const idxVal = evalExpr(expr.index, scope, ctx);
        if (obj.kind === 'list' && idxVal.kind === 'number') {
          const idx = idxVal.value < 0 ? obj.items.length + idxVal.value : idxVal.value;
          if (idx < 0 || idx >= obj.items.length) throw new PyRuntimeError('IndexError', '串列索引超出範圍');
          return obj.items[idx];
        }
        if (obj.kind === 'dict') {
          const key = formatPyVal(idxVal, false);
          if (!obj.entries.has(key)) throw new PyRuntimeError('KeyError', `找不到鍵值 '${key}'`);
          return obj.entries.get(key)!;
        }
        if (obj.kind === 'string' && idxVal.kind === 'number') {
          const idx = idxVal.value < 0 ? obj.value.length + idxVal.value : idxVal.value;
          if (idx < 0 || idx >= obj.value.length) throw new PyRuntimeError('IndexError', '字串索引超出範圍');
          return makeStr(obj.value[idx]);
        }
        throw new PyRuntimeError('TypeError', `此物件不支援索引存取`);
      }
      case 'attr': {
        const obj = evalExpr(expr.obj, scope, ctx);
        if (obj.kind === 'instance') {
          // Check @property first
          const prop = resolveProperty(obj.classRef, expr.attr);
          if (prop?.getter) {
            return invokeFunction(prop.getter, [obj], {}, obj.classRef, obj);
          }
          // Check private mangling
          const mangled =
            expr.attr.startsWith('__') && !expr.attr.endsWith('__') && ctx.currentClass
              ? `_${ctx.currentClass.name}${expr.attr}`
              : expr.attr;
          if (mangled in obj.attrs) return obj.attrs[mangled];
          if (expr.attr in obj.attrs) return obj.attrs[expr.attr];
          const clsAttr = resolveClassAttr(obj.classRef, expr.attr);
          if (clsAttr !== undefined) return clsAttr;
          if (expr.attr === '__class__') {
            return { kind: 'class', classRef: obj.classRef, id: obj.classRef.id };
          }
          throw new PyRuntimeError('AttributeError', `'${obj.classRef.name}' 物件沒有 '${expr.attr}' 屬性`);
        }
        if (obj.kind === 'class') {
          if (expr.attr === '__name__') return makeStr(obj.classRef.name);
          if (expr.attr === '__mro__') {
            return makeList(getMro(obj.classRef).map((c) => ({ kind: 'class', classRef: c, id: c.id })));
          }
          const clsAttr = resolveClassAttr(obj.classRef, expr.attr);
          if (clsAttr !== undefined) return clsAttr;
          throw new PyRuntimeError('AttributeError', `類別 '${obj.classRef.name}' 沒有 '${expr.attr}' 屬性`);
        }
        throw new PyRuntimeError('AttributeError', `物件沒有 '${expr.attr}' 屬性`);
      }
      case 'call': {
        // Handle super().method(...)
        if (
          expr.callee.kind === 'attr' &&
          expr.callee.obj.kind === 'call' &&
          expr.callee.obj.callee.kind === 'ident' &&
          expr.callee.obj.callee.name === 'super'
        ) {
          if (!ctx.currentClass || !ctx.selfInstance || ctx.selfInstance.kind !== 'instance') {
            throw new PyRuntimeError('RuntimeError', 'super() 只能在類別方法中使用');
          }
          const methodName = expr.callee.attr;
          const found = resolveMethod(ctx.selfInstance.classRef, methodName, ctx.currentClass);
          if (!found) {
            throw new PyRuntimeError('AttributeError', `父類別沒有 '${methodName}' 方法`);
          }
          const posArgs = expr.args.filter((a) => !a.name).map((a) => evalExpr(a.value, scope, ctx));
          const kwArgs: Record<string, PyVal> = {};
          expr.args.filter((a) => a.name).forEach((a) => (kwArgs[a.name!] = evalExpr(a.value, scope, ctx)));
          return invokeFunction(found.fn, [ctx.selfInstance, ...posArgs], kwArgs, found.owner, ctx.selfInstance);
        }

        // Method call on an object: obj.method(...)
        if (expr.callee.kind === 'attr') {
          const targetObj = evalExpr(expr.callee.obj, scope, ctx);
          const methodName = expr.callee.attr;
          const posArgs = expr.args.filter((a) => !a.name).map((a) => evalExpr(a.value, scope, ctx));
          const kwArgs: Record<string, PyVal> = {};
          expr.args.filter((a) => a.name).forEach((a) => (kwArgs[a.name!] = evalExpr(a.value, scope, ctx)));

          if (targetObj.kind === 'instance') {
            const found = resolveMethod(targetObj.classRef, methodName);
            if (!found) {
              throw new PyRuntimeError('AttributeError', `'${targetObj.classRef.name}' 物件沒有 '${methodName}' 方法`);
            }
            return invokeFunction(found.fn, [targetObj, ...posArgs], kwArgs, found.owner, targetObj);
          }

          if (targetObj.kind === 'list') {
            if (methodName === 'append') {
              if (posArgs.length < 1) throw new PyRuntimeError('TypeError', 'append() 需要 1 個參數');
              targetObj.items.push(posArgs[0]);
              mutatedObjectIds.add(targetObj.id);
              return makeNone();
            }
            if (methodName === 'pop') {
              const popped = targetObj.items.pop() || makeNone();
              mutatedObjectIds.add(targetObj.id);
              return popped;
            }
            if (methodName === 'copy') {
              const copied = makeList([...targetObj.items]);
              newObjectIds.add(copied.id);
              return copied;
            }
          }

          if (targetObj.kind === 'string') {
            if (methodName === 'upper') return makeStr(targetObj.value.toUpperCase());
            if (methodName === 'lower') return makeStr(targetObj.value.toLowerCase());
          }

          throw new PyRuntimeError('AttributeError', `物件沒有 '${methodName}' 方法`);
        }

        // Builtins
        if (expr.callee.kind === 'ident') {
          const fname = expr.callee.name;
          const posArgs = expr.args.filter((a) => !a.name).map((a) => evalExpr(a.value, scope, ctx));
          const kwArgs: Record<string, PyVal> = {};
          expr.args.filter((a) => a.name).forEach((a) => (kwArgs[a.name!] = evalExpr(a.value, scope, ctx)));

          if (fname === 'print') {
            const lineOut = posArgs.map((a) => formatPyVal(a, false)).join(' ');
            stdout.push(lineOut);
            return makeNone();
          }
          if (fname === 'len') {
            const a = posArgs[0];
            if (!a) throw new PyRuntimeError('TypeError', 'len() 需要 1 個參數');
            if (a.kind === 'list') return makeNum(a.items.length);
            if (a.kind === 'string') return makeNum(a.value.length);
            if (a.kind === 'dict') return makeNum(a.entries.size);
            if (a.kind === 'instance') {
              const lenFn = resolveMethod(a.classRef, '__len__');
              if (lenFn) return invokeFunction(lenFn.fn, [a], {}, lenFn.owner, a);
            }
            throw new PyRuntimeError('TypeError', `'${a.kind}' 型別沒有 len() 長度`);
          }
          if (fname === 'id') {
            const a = posArgs[0];
            if (!a) throw new PyRuntimeError('TypeError', 'id() 需要 1 個參數');
            return makeStr(getAddr(a.id));
          }
          if (fname === 'type') {
            const a = posArgs[0];
            if (!a) throw new PyRuntimeError('TypeError', 'type() 需要 1 個參數');
            const tName =
              a.kind === 'instance'
                ? a.classRef.name
                : a.kind === 'list'
                  ? 'list'
                  : a.kind === 'dict'
                    ? 'dict'
                    : a.kind === 'number'
                      ? Number.isInteger(a.value)
                        ? 'int'
                        : 'float'
                      : a.kind === 'string'
                        ? 'str'
                        : a.kind === 'bool'
                          ? 'bool'
                          : 'NoneType';
            return makeStr(`<class '${tName}'>`);
          }
          if (fname === 'isinstance') {
            const [obj, clsVal] = posArgs;
            if (!obj || !clsVal || clsVal.kind !== 'class') return makeBool(false);
            if (obj.kind !== 'instance') return makeBool(false);
            return makeBool(getMro(obj.classRef).includes(clsVal.classRef));
          }
          if (fname === 'str') return makeStr(posArgs[0] ? formatPyVal(posArgs[0], false) : '');
          if (fname === 'int') return makeNum(parseInt(formatPyVal(posArgs[0] || makeNum(0), false), 10) || 0);
          if (fname === 'float') return makeNum(parseFloat(formatPyVal(posArgs[0] || makeNum(0), false)) || 0);
          if (fname === 'round') return makeNum(Math.round(posArgs[0]?.kind === 'number' ? posArgs[0].value : 0));
          if (fname === 'ValueError' || fname === 'TypeError' || fname === 'Exception') {
            const msg = posArgs[0] ? formatPyVal(posArgs[0], false) : '';
            return makeStr(`${fname}: ${msg}`);
          }
          if (fname === 'range') {
            const n = posArgs[0]?.kind === 'number' ? posArgs[0].value : 0;
            const start = posArgs.length >= 2 && posArgs[0].kind === 'number' ? posArgs[0].value : 0;
            const stop = posArgs.length >= 2 && posArgs[1].kind === 'number' ? posArgs[1].value : n;
            const arr: PyVal[] = [];
            for (let k = start; k < stop && arr.length < 50; k++) arr.push(makeNum(k));
            return makeList(arr);
          }

          // Class instantiation or Top-level function
          const target = scope[fname] || globalScope[fname] || (classRegistry[fname] ? { kind: 'class' as const, classRef: classRegistry[fname], id: classRegistry[fname].id } : undefined);
          if (!target) {
            throw new PyRuntimeError('NameError', `未定義的函式或類別 '${fname}'`);
          }

          if (target.kind === 'class') {
            const cls = target.classRef;
            const instance: PyVal = {
              kind: 'instance',
              classRef: cls,
              attrs: {},
              id: nextId(),
            };
            getAddr(instance.id);
            newObjectIds.add(instance.id);
            const initMethod = resolveMethod(cls, '__init__');
            if (initMethod) {
              invokeFunction(initMethod.fn, [instance, ...posArgs], kwArgs, initMethod.owner, instance);
            }
            return instance;
          }

          if (target.kind === 'function') {
            return invokeFunction(target.funcRef, posArgs, kwArgs);
          }
        }

        throw new PyRuntimeError('TypeError', '此物件不可呼叫');
      }
    }
  }

  function executeBlock(
    nodes: AstNode[],
    scope: Record<string, PyVal>,
    ctx: { currentClass?: PyClass; selfInstance?: PyVal },
    isModuleLevel = false
  ) {
    for (const node of nodes) {
      if (steps.length >= maxSteps) break;

      switch (node.type) {
        case 'class': {
          const bases: PyClass[] = node.baseNames.map((bn) => {
            if (!classRegistry[bn]) {
              throw new PyRuntimeError('NameError', `找不到父類別 '${bn}'`);
            }
            return classRegistry[bn];
          });
          const pyClass: PyClass = {
            name: node.name,
            bases,
            classAttrs: {},
            methods: {},
            properties: {},
            id: nextId(),
          };
          for (const item of node.body) {
            if (item.type === 'def') {
              const fn: PyFunc = {
                name: item.name,
                params: item.params,
                body: item.body,
                definingClass: node.name,
              };
              if (item.decorators.includes('property')) {
                pyClass.properties[item.name] = { ...pyClass.properties[item.name], getter: fn };
              } else {
                const setterDec = item.decorators.find((d) => d.endsWith('.setter'));
                if (setterDec) {
                  const propName = setterDec.replace(/\.setter$/, '');
                  pyClass.properties[propName] = { ...pyClass.properties[propName], setter: fn };
                } else {
                  pyClass.methods[item.name] = fn;
                }
              }
            } else if (item.type === 'assign' && item.target.kind === 'ident') {
              pyClass.classAttrs[item.target.name] = evalExpr(item.value, scope, { currentClass: pyClass });
            }
          }
          classRegistry[node.name] = pyClass;
          globalScope[node.name] = { kind: 'class', classRef: pyClass, id: pyClass.id };
          if (isModuleLevel) {
            const baseText = node.baseNames.length ? `（繼承自 ${node.baseNames.join(', ')}）` : '';
            recordStep(node.line, `定義類別藍圖 class ${node.name}${baseText}，註冊屬性與方法。`);
          }
          break;
        }
        case 'def': {
          const fn: PyFunc = {
            name: node.name,
            params: node.params,
            body: node.body,
          };
          scope[node.name] = { kind: 'function', funcRef: fn, id: nextId() };
          if (isModuleLevel) {
            recordStep(node.line, `定義函式 ${node.name}(${node.params.join(', ')})。`);
          }
          break;
        }
        case 'assign': {
          const rhsVal = evalExpr(node.value, scope, ctx);
          if (node.target.kind === 'ident') {
            const name = node.target.name;
            let finalVal = rhsVal;
            if (node.op !== '=') {
              const prev = scope[name] ?? globalScope[name];
              if (!prev) throw new PyRuntimeError('NameError', `未定義變數 '${name}'`);
              if (prev.kind === 'number' && rhsVal.kind === 'number') {
                finalVal = makeNum(node.op === '+=' ? prev.value + rhsVal.value : prev.value - rhsVal.value);
              }
            }
            scope[name] = finalVal;
            if (isModuleLevel) {
              changedVarNames.add(name);
              const targetAddr = getAddr(finalVal.id);
              const aliasMatch = Object.entries(globalScope).find(
                ([k, v]) => k !== name && v.id === finalVal.id && v.kind !== 'class' && v.kind !== 'function'
              );
              const desc = aliasMatch
                ? `變數 ${name} 指向與 ${aliasMatch[0]} 相同的記憶體物件 (${targetAddr})。`
                : `變數 ${name} 綁定至記憶體物件 ${formatPyVal(finalVal, true)} (${targetAddr})。`;
              recordStep(node.line, desc);
            }
          } else if (node.target.kind === 'attr') {
            const targetObj = evalExpr(node.target.obj, scope, ctx);
            const attrName = node.target.attr;
            if (targetObj.kind === 'instance') {
              const prop = resolveProperty(targetObj.classRef, attrName);
              if (prop?.setter && node.op === '=') {
                invokeFunction(prop.setter, [targetObj, rhsVal], {}, targetObj.classRef, targetObj);
              } else {
                const mangled =
                  attrName.startsWith('__') && !attrName.endsWith('__') && ctx.currentClass
                    ? `_${ctx.currentClass.name}${attrName}`
                    : attrName;
                if (node.op === '=') {
                  targetObj.attrs[mangled] = rhsVal;
                } else {
                  const prev = targetObj.attrs[mangled];
                  if (prev?.kind === 'number' && rhsVal.kind === 'number') {
                    targetObj.attrs[mangled] = makeNum(
                      node.op === '+=' ? prev.value + rhsVal.value : prev.value - rhsVal.value
                    );
                  }
                }
                mutatedObjectIds.add(targetObj.id);
              }
              if (isModuleLevel || callStack.length <= 2) {
                recordStep(
                  node.line,
                  `設定 ${targetObj.classRef.name} 實例 (${getAddr(targetObj.id)}) 的屬性 .${attrName} = ${formatPyVal(rhsVal, true)}。`
                );
              }
            } else if (targetObj.kind === 'class') {
              if (node.op === '=') {
                targetObj.classRef.classAttrs[attrName] = rhsVal;
              } else {
                const prev = targetObj.classRef.classAttrs[attrName];
                if (prev?.kind === 'number' && rhsVal.kind === 'number') {
                  targetObj.classRef.classAttrs[attrName] = makeNum(
                    node.op === '+=' ? prev.value + rhsVal.value : prev.value - rhsVal.value
                  );
                }
              }
              if (isModuleLevel || callStack.length <= 2) {
                recordStep(node.line, `更新類別 ${targetObj.classRef.name} 的共用類別屬性 ${attrName}。`);
              }
            }
          } else if (node.target.kind === 'index') {
            const targetObj = evalExpr(node.target.obj, scope, ctx);
            const idxVal = evalExpr(node.target.index, scope, ctx);
            if (targetObj.kind === 'list' && idxVal.kind === 'number') {
              targetObj.items[idxVal.value] = rhsVal;
              mutatedObjectIds.add(targetObj.id);
              if (isModuleLevel) {
                recordStep(node.line, `修改串列 (${getAddr(targetObj.id)}) 索引 [${idxVal.value}] 為 ${formatPyVal(rhsVal, true)}。`);
              }
            }
          }
          break;
        }
        case 'return': {
          const val = node.value ? evalExpr(node.value, scope, ctx) : makeNone();
          throw new ReturnSignal(val);
        }
        case 'raise': {
          const val = evalExpr(node.expr, scope, ctx);
          throw new PyRuntimeError('ValueError', formatPyVal(val, false));
        }
        case 'if': {
          for (const b of node.branches) {
            if (!b.cond || isTruthy(evalExpr(b.cond, scope, ctx))) {
              executeBlock(b.body, scope, ctx, isModuleLevel);
              break;
            }
          }
          break;
        }
        case 'for': {
          const iterVal = evalExpr(node.iter, scope, ctx);
          if (iterVal.kind !== 'list') {
            throw new PyRuntimeError('TypeError', '此物件不可迭代');
          }
          for (const item of iterVal.items) {
            scope[node.varName] = item;
            if (isModuleLevel) changedVarNames.add(node.varName);
            executeBlock(node.body, scope, ctx, isModuleLevel);
          }
          break;
        }
        case 'try': {
          try {
            executeBlock(node.tryBody, scope, ctx, isModuleLevel);
          } catch (err) {
            if (err instanceof ReturnSignal) throw err;
            if (err instanceof PyRuntimeError) {
              if (node.exceptVar) {
                scope[node.exceptVar] = makeStr(err.message);
              }
              executeBlock(node.exceptBody, scope, ctx, isModuleLevel);
            } else {
              throw err;
            }
          }
          break;
        }
        case 'expr': {
          const beforeOut = stdout.length;
          evalExpr(node.expr, scope, ctx);
          if (isModuleLevel) {
            const newOut = stdout.slice(beforeOut);
            const desc =
              newOut.length > 0
                ? `執行運算並輸出到主控台：「${newOut.join(' ')}」`
                : `執行方法或物件操作（第 ${node.line} 行）。`;
            recordStep(node.line, desc);
          }
          break;
        }
      }
    }
  }

  try {
    const lines = preprocessLines(code);
    const { nodes } = parseBlock(lines, 0, 0);
    executeBlock(nodes, globalScope, {}, true);
    return {
      steps,
      stdout,
      finalEnv: { variables: globalScope, classes: classRegistry },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const lastLine = steps.length > 0 ? steps[steps.length - 1].lineNumber : 1;
    recordStep(lastLine, `發生例外錯誤：${message}`, message);
    return {
      steps,
      stdout,
      error: message,
      finalEnv: { variables: globalScope, classes: classRegistry },
    };
  }
}

export function formatPyValForTest(val: PyVal): string {
  switch (val.kind) {
    case 'none':
      return 'None';
    case 'bool':
      return val.value ? 'True' : 'False';
    case 'number':
      return String(val.value);
    case 'string':
      return val.value;
    case 'list':
      return `[${val.items.map(formatPyValForTest).join(', ')}]`;
    case 'instance':
      return `<${val.classRef.name}>`;
    default:
      return String(val.kind);
  }
}
