/* Real (tiny) simulations used by the hands-on stops. Pure functions, unit-tested. */

export const nand = (a, b) => (a && b ? 0 : 1);

/* A CMOS NAND gate: two PMOS in parallel to the supply, two NMOS in series to ground.
   PMOS conducts when its input is 0, NMOS when its input is 1. */
export function nandTransistors(a, b) {
  const pA = !a, pB = !b, nA = !!a, nB = !!b;
  const pullUp = pA || pB, pullDown = nA && nB;
  return { pA, pB, nA, nB, pullUp, pullDown, out: pullUp ? 1 : 0 };
}

/* A full adder built only from NAND gates (9 of them). */
export function fullAdder(a, b, cin) {
  const n1 = nand(a, b), n2 = nand(a, n1), n3 = nand(b, n1), x = nand(n2, n3); // x = a XOR b
  const n5 = nand(x, cin), n6 = nand(x, n5), n7 = nand(cin, n5);
  return { sum: nand(n6, n7), cout: nand(n5, n1), gates: 9 };
}

/* Ripple-carry adder: chain of full adders, least significant bit first. */
export function rippleAdd(A, B, bits = 4) {
  let carry = 0, sum = 0; const steps = [];
  for (let i = 0; i < bits; i++) {
    const a = (A >> i) & 1, b = (B >> i) & 1, r = fullAdder(a, b, carry);
    steps.push({ i, a, b, cin: carry, s: r.sum, cout: r.cout });
    sum |= r.sum << i; carry = r.cout;
  }
  return { sum, carryOut: carry, total: sum | (carry << bits), steps };
}

/* A toy CPU. Memory holds a 5-instruction program and two numbers.
   Each instruction goes through FETCH → DECODE → EXECUTE. */
export const PROGRAM = [
  { op: 'LOAD', r: 0, addr: 6, text: 'LOAD R0, [6]' },
  { op: 'LOAD', r: 1, addr: 7, text: 'LOAD R1, [7]' },
  { op: 'ADD', r: 0, r2: 1, text: 'ADD R0, R1' },
  { op: 'OUT', r: 0, text: 'OUT R0 → screen' },
  { op: 'HALT', text: 'HALT' }
];
export const PHASES = ['fetch', 'decode', 'execute'];

export function makeCpu(x = 7, y = 5) {
  const mem = [...PROGRAM.map(p => p.text), null, x & 255, y & 255];
  return { pc: 0, ir: null, phase: 'fetch', reg: [0, 0], mem, out: null, halted: false, cycle: 0, log: [] };
}

/* Advances one phase. Returns a new state (does not mutate). */
export function stepCpu(s) {
  if (s.halted) return s;
  const n = { ...s, reg: [...s.reg], log: [...s.log], cycle: s.cycle + 1 };
  if (s.phase === 'fetch') {
    n.ir = PROGRAM[s.pc]; n.pc = s.pc + 1; n.phase = 'decode';
    n.log.push(`FETCH  #${s.pc}: ${n.ir.text}`);
  } else if (s.phase === 'decode') {
    n.phase = 'execute';
    n.log.push(`DECODE ${s.ir.op}` + (s.ir.op === 'LOAD' ? ` → memory[${s.ir.addr}] into R${s.ir.r}` : s.ir.op === 'ADD' ? ' → send R0 and R1 to the adder (ALU)' : s.ir.op === 'OUT' ? ' → write R0 to the frame buffer' : ' → stop'));
  } else {
    const i = s.ir;
    if (i.op === 'LOAD') n.reg[i.r] = s.mem[i.addr];
    else if (i.op === 'ADD') n.reg[i.r] = rippleAdd(s.reg[i.r], s.reg[i.r2], 8).sum;
    else if (i.op === 'OUT') n.out = s.reg[i.r];
    else if (i.op === 'HALT') n.halted = true;
    n.log.push(`EXEC   ${i.text}` + (i.op === 'LOAD' ? ` (R${i.r} = ${n.reg[i.r]})` : i.op === 'ADD' ? ` (R0 = ${n.reg[0]})` : i.op === 'OUT' ? ` (screen shows ${n.out})` : ''));
    n.phase = 'fetch';
  }
  return n;
}
export function runCpu(x, y, max = 100) { let s = makeCpu(x, y); while (!s.halted && max--) s = stepCpu(s); return s; }

/* Pixel colours. */
export const hex2 = v => (v & 255).toString(16).padStart(2, '0').toUpperCase();
export const bin8 = v => (v & 255).toString(2).padStart(8, '0');
export const rgbHex = (r, g, b) => '#' + hex2(r) + hex2(g) + hex2(b);

/* A 3×5 pixel font for digits, used to draw the CPU's answer on the 3D screen. */
const FONT = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111']
};
/* Returns a Set of "x,y" pixels that are on, for a number drawn centred on a w×h screen. */
export function numberPixels(n, w = 16, h = 9) {
  const digits = String(n).split(''), width = digits.length * 4 - 1, x0 = Math.floor((w - width) / 2), y0 = Math.floor((h - 5) / 2), on = new Set();
  digits.forEach((d, k) => FONT[d].forEach((row, y) => [...row].forEach((c, x) => { if (c === '1') on.add(`${x0 + k * 4 + x},${y0 + y}`); })));
  return on;
}
