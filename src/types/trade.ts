export interface Trade {
  id: number | string;
  date: string;
  pair: string;
  side: "BUY" | "SELL";
  entry: number;
  exit: number | null;
  size: number;
  fee: number;
  feeCurrency?: string;
  exchange: string;
}

export interface TradeForm {
  date: string;
  pair: string;
  side: string;
  entry: string;
  exit: string;
  size: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface ValidationResult {
  errors: ValidationErrors;
  warnings: ValidationErrors;
  isValid: boolean;
  isComplete: boolean;
}

export interface NormalisedTrade extends Trade {
  _validation: ValidationResult;
}

export interface ImportError {
  index: number;
  errors: string[];
  raw: string;
}

export interface ImportResult {
  error?: string;
  imported?: number;
  skipped?: number;
  incomplete?: number;
  errors?: ImportError[];
}

export interface EquityPoint {
  date: string;
  equity: number;
  pnl?: number;
  pair?: string;
  side?: string;
}

export interface Stats {
  curve: EquityPoint[];
  wins: number;
  losses: number;
  openCount: number;
  totalPnl: number;
  totalFees: number;
  winRate: number;
  maxDD: number;
  avgWin: number;
  avgLoss: number;
  finalEquity: number;
}
