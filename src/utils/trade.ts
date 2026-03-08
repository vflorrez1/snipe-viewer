import type { Trade, ValidationResult, NormalisedTrade } from "../types/trade";

export function validateTrade(trade: Partial<Trade>): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!trade.date) errors.date = "Required for ordering trades";
  if (!trade.pair) errors.pair = "Required to identify the asset";
  if (!["BUY", "SELL"].includes(trade.side || ""))
    errors.side = "Must be BUY or SELL";
  if (!trade.entry || isNaN(trade.entry) || trade.entry <= 0)
    errors.entry = "Required — entry price must be a positive number";
  if (!trade.size || isNaN(trade.size) || trade.size <= 0)
    errors.size = "Required — size must be a positive number";

  if (!trade.exit || isNaN(trade.exit) || trade.exit <= 0)
    warnings.exit = "No exit price — trade marked as open, excluded from P&L";

  return {
    errors,
    warnings,
    isValid: Object.keys(errors).length === 0,
    isComplete: Object.keys(warnings).length === 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normaliseTrade(raw: any, index: number): NormalisedTrade {
  let date =
    raw.date || raw.timestamp || raw.time || raw.createdAt || raw.created_at;
  if (date) date = date.toString().slice(0, 10);
  const pair = raw.pair || raw.symbol || raw.market;
  let side = (raw.side || raw.direction || raw.type || "")
    .toString()
    .toUpperCase();
  if (side === "LONG") side = "BUY";
  if (side === "SHORT") side = "SELL";
  const entry = parseFloat(
    raw.entry || raw.entryPrice || raw.entry_price || raw.open
  );
  const exit = parseFloat(
    raw.exit || raw.exitPrice || raw.exit_price || raw.close
  );
  const size = parseFloat(raw.size || raw.amount || raw.quantity || raw.qty);
  const fee = parseFloat(raw.fee) || 0;
  const feeCurrency = raw.feeCurrency || raw.fee_currency || "USDT";
  const exchange = raw.exchange || raw.venue || "";
  const id = raw.id || raw.orderId || raw.order_id || Date.now() + index;

  const normalised = {
    id,
    date,
    pair,
    side,
    entry,
    exit: isNaN(exit) ? null : exit,
    size,
    fee,
    feeCurrency,
    exchange,
  } as Trade;

  const validation = validateTrade(normalised);
  return { ...normalised, _validation: validation } as NormalisedTrade;
}

export function isOpen(trade: Trade): boolean {
  return !trade.exit || isNaN(trade.exit);
}

export function pnl(trade: Trade): number | null {
  if (isOpen(trade)) return null;
  const gross =
    trade.side === "BUY"
      ? (trade.exit! - trade.entry) * trade.size
      : (trade.entry - trade.exit!) * trade.size;
  return gross - (trade.fee || 0);
}

export function pct(trade: Trade): number {
  return trade.side === "BUY"
    ? ((trade.exit! - trade.entry) / trade.entry) * 100
    : ((trade.entry - trade.exit!) / trade.entry) * 100;
}

export function fmt(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
