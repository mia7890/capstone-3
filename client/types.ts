export type PageId =
  | 'page-home'
  | 'page-stock-in'
  | 'page-deduct'
  | 'page-inventory'
  | 'page-forecast'
  | 'page-analytics'
  | 'page-admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'pending' | 'active' | 'deactivated';
  accessCode?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface BulkManualRow {
  brand: string;
  model: string;
  storage: string;
  color: string;
  condition: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
}

export const MODEL_PRICES: Record<string, { cost: number; price: number; storage: string }> = {
  'iPhone 12 Mini': { cost: 13500, price: 16500, storage: '128GB' },
  'iPhone 13': { cost: 18200, price: 21500, storage: '128GB' },
  'iPhone 11': { cost: 12000, price: 14800, storage: '128GB' },
  'iPhone 12': { cost: 15000, price: 18000, storage: '128GB' },
  'iPhone 12 Pro Max': { cost: 22500, price: 26000, storage: '128GB' },
  'iPhone 13 Mini': { cost: 16500, price: 19500, storage: '128GB' },
  'iPhone 13 Pro': { cost: 25500, price: 29000, storage: '128GB' },
  'iPhone 13 Pro Max': { cost: 29500, price: 33500, storage: '128GB' },
  'iPhone 14': { cost: 23500, price: 27000, storage: '128GB' },
  'iPhone 14 Plus': { cost: 26500, price: 30000, storage: '128GB' },
  'iPhone 14 Pro': { cost: 32500, price: 36500, storage: '128GB' },
  'iPhone 14 Pro Max': { cost: 39500, price: 44500, storage: '256GB' },
  'iPhone 15': { cost: 30500, price: 34500, storage: '128GB' },
  'iPhone 15 Plus': { cost: 34500, price: 38500, storage: '128GB' },
  'iPhone 15 Pro': { cost: 41500, price: 46000, storage: '128GB' },
  'iPhone 15 Pro Max': { cost: 48500, price: 53900, storage: '256GB' },
  'iPhone 16': { cost: 38500, price: 43000, storage: '128GB' },
  'iPhone 16 Pro': { cost: 50000, price: 55500, storage: '128GB' },
  'iPhone 16 Pro Max': { cost: 58000, price: 63500, storage: '256GB' },
  'iPhone 17': { cost: 46000, price: 51500, storage: '128GB' },
  'iPhone 17 Pro': { cost: 59000, price: 65000, storage: '128GB' },
  'iPhone 17 Pro Max': { cost: 68000, price: 74500, storage: '256GB' },
  'iPad 9th Gen': { cost: 13500, price: 16200, storage: '64GB' },
  'iPad 10th Gen': { cost: 18500, price: 21800, storage: '64GB' },
  'iPad 11th Gen': { cost: 21000, price: 24500, storage: '128GB' },
  'iPad Air 5th Gen': { cost: 24000, price: 27800, storage: '64GB' },
  'AirPods Pro (2nd Gen)': { cost: 9800, price: 11900, storage: 'N/A' },
  'AirPods (3rd Gen)': { cost: 6800, price: 8500, storage: 'N/A' },
  'Apple EarPods': { cost: 850, price: 1350, storage: 'N/A' },
  'Apple Watch Series 9': { cost: 16500, price: 19800, storage: '64GB' },
  'Apple Watch SE': { cost: 11500, price: 14200, storage: '64GB' },
  'Samsung Galaxy A07': { cost: 4800, price: 6500, storage: '128GB' },
  'Samsung Galaxy S23 Ultra': { cost: 32000, price: 36500, storage: '256GB' },
  'Samsung Galaxy S24 Ultra': { cost: 45000, price: 50500, storage: '256GB' },
  'Samsung Galaxy A55 5G': { cost: 14500, price: 17200, storage: '128GB' },
  'Samsung Galaxy Tab A9+': { cost: 9200, price: 11500, storage: '128GB' },
};

export const MR_VENTURA_SAMPLE_NOTE = `12MINI 64 (4) - 7,000 // 28,000
12MINI 128 (8) - 8,500 // 68,000
12MINI 256 (9) - 11,000 // 99,000
_____________________________________
12MINI 64 (4)
 - FOCUS / SHAKY (2) - 6,000 // 12,000
 - LCD SPOT (1) - 5,500
 - UPPER SPEAKER (1) - 6,000

12MINI 128 (1)
 - SPOT / NO LOWER SPEAKER (1) - 8K

12MINI 256 (4)
 - LCD PROBLEM (1) (REPLACED) - 7,500
 - LCD PROBLEM (1) (SLIGHT) - 7,000
 - BACKGLASS (1) - 8,000
 - DATA USE / WIFI IC / UNK BATT (1) - 6,000

13 256 Sim Locked (1) (Auto Restart) - 10K
_____________________________________
TOTAL UNITS: 104PCS
OVERALL TOTAL: 1,026,300`;

export const STANDARD_BATCH_NOTE = `iPhone 12 Mini 128GB Black x10 Cost 13500 Price 16500
iPhone 12 Mini 128GB White x8 Cost 13500 Price 16500
iPhone 13 128GB Pink x10 Cost 18200 Price 21500
iPhone 13 128GB Midnight x6 Cost 18200 Price 21500`;

export function peso(n: number | string | undefined): string {
  return 'PHP ' + Math.round(Number(n) || 0).toLocaleString('en-PH');
}

export function getColorHex(colorName: string = ''): { bg: string; border: string } {
  const c = colorName.toLowerCase();
  if (c.includes('issue')) return { bg: '#f43f5e', border: '#be123c' };
  if (c.includes('pink') || c.includes('rose')) return { bg: '#f472b6', border: '#db2777' };
  if (c.includes('blue') || c.includes('pacific') || c.includes('sierra'))
    return { bg: '#3b82f6', border: '#1d4ed8' };
  if (c.includes('green') || c.includes('alpine') || c.includes('mint'))
    return { bg: '#10b981', border: '#047857' };
  if (c.includes('purple') || c.includes('violet') || c.includes('lavender'))
    return { bg: '#a855f7', border: '#7e22ce' };
  if (c.includes('red')) return { bg: '#ef4444', border: '#b91c1c' };
  if (c.includes('gold') || c.includes('yellow') || c.includes('desert'))
    return { bg: '#f59e0b', border: '#b45309' };
  if (c.includes('white') || c.includes('starlight'))
    return { bg: '#f8fafc', border: '#94a3b8' };
  if (c.includes('silver') || c.includes('gray') || c.includes('grey') || c.includes('titanium'))
    return { bg: '#9ca3af', border: '#4b5563' };
  if (c.includes('midnight')) return { bg: '#1e293b', border: '#0f172a' };
  return { bg: '#18181b', border: '#09090b' };
}

export const CHART_PALETTE = [
  '#7eb0f5', // Soft Blue
  '#27272a', // Dark Charcoal
  '#3b82f6', // Royal Blue
  '#64748b', // Slate
  '#94a3b8', // Cool Gray
  '#1e293b', // Deep Slate
];

export function playScannerBeep(): void {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
    g.gain.setValueAtTime(0.14, ctx.currentTime);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (_) {}
}
