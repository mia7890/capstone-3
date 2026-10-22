export type SalesChannel = 'TikTok' | 'Facebook' | 'Instagram' | 'Referral';
export type FulfillmentMethod = 'Meet-up' | 'COD';
export type DeductMethod = 'BARCODE_SCAN' | 'MANUAL_PICK';
export type StockInSource = 'NOTE_PASTE' | 'MANUAL_DROPDOWN';
export type ProductBrand = 'Apple iPhone' | 'Apple iPad' | 'Apple AirPods' | 'Samsung' | 'Android / Other';
export type ProductCondition =
  | 'Pre-Owned (Smooth)'
  | 'Brand New (Sealed)'
  | 'Brand New'
  | 'Factory Unlocked'
  | 'Class B'
  | 'Class C'
  | 'Class B/C'
  | 'Needs Repair / With Issue'
  | 'Needs Repair';

export interface InventoryItem {
  id: string;
  sku: string; // Deterministic unique system barcode e.g. LPG-IP12M-128-BLK
  brand: ProductBrand;
  model: string;
  storage: string;
  color: string;
  condition: ProductCondition;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  isCoreSeller: boolean;
  assignedTo?: string; // Staff member name or 'All Staff'
  lastRestockedAt: string;
  createdAt: string;
}

export interface ParsedNoteItem {
  rawLine: string;
  brand: ProductBrand;
  model: string;
  storage: string;
  color: string;
  condition: ProductCondition;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  unitProfit: number;
  sku: string;
  existingMatchId?: string;
  existingQty?: number;
  matchStatus: 'MERGE_EXISTING' | 'NEW_VARIANT';
  priceAutoFilled: boolean;
  warning?: string;
}

export interface StockInRecord {
  id: string;
  batchCode: string;
  source: StockInSource;
  rawNote?: string;
  items: {
    sku: string;
    brand: ProductBrand;
    model: string;
    storage: string;
    color: string;
    condition: ProductCondition;
    quantityAdded: number;
    costPrice: number;
    sellingPrice: number;
    action: 'MERGED' | 'CREATED';
  }[];
  totalUnits: number;
  totalCapitalCost: number;
  projectedGrossSales: number;
  projectedNetProfit: number;
  handledBy: string;
  createdAt: string;
}

export interface SaleTransaction {
  id: string;
  receiptNo: string;
  sku: string;
  brand: ProductBrand;
  model: string;
  storage: string;
  color: string;
  condition: ProductCondition;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  deductMethod: DeductMethod;
  channel: SalesChannel;
  fulfillment: FulfillmentMethod;
  clientName: string;
  location: string;
  handledBy: string;
  createdAt: string;
}

export interface ForecastItem {
  sku: string;
  brand: ProductBrand;
  model: string;
  storage: string;
  color: string;
  condition: ProductCondition;
  currentStock: number;
  unitCost: number;
  sellingPrice: number;
  unitProfit: number;
  soldLast7Days: number;
  soldLast30Days: number;
  weightedDailyBurnRate: number; // Exponentially weighted daily demand (units/day)
  weekendPeakBurnRate: number; // Friday & Saturday peak rate
  demandStdDev: number; // Standard deviation of daily demand
  safetyStock: number; // Buffer stock for 7-day replenishment cycle
  reorderPoint: number; // Stock level that triggers reorder
  daysUntilStockout: number;
  forecast7DayStandard: number;
  forecast30DayStandard: number;
  forecastNov30Surge: number; // 13th-month pay & holiday surge (1.85x)
  recommendedOrderQty: number;
  recommendedNov30OrderQty: number;
  estimatedRestockCost: number;
  projectedRestockProfit: number;
  priority: 'CRITICAL' | 'REORDER_NOW' | 'PREPARE_PEAK' | 'OPTIMAL';
  analyticalNote: string;
}

export interface SystemDiagnosticCheck {
  id: string;
  title: string;
  category: 'DATA_INTEGRITY' | 'ACCURACY' | 'ANTI_DUPLICATION' | 'FORECAST_MODEL';
  passed: boolean;
  metric: string;
  detail: string;
}

export type UserRole = 'admin' | 'staff';
export type UserStatus = 'pending' | 'active' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  accessCode: string; // 6-digit numeric code used to log in
  createdAt: string;
  approvedAt?: string;
}

export interface DatabaseSchema {
  inventory: InventoryItem[];
  stockInHistory: StockInRecord[];
  salesHistory: SaleTransaction[];
  users?: User[];
}
