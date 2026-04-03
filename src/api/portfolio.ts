const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_KEY = import.meta.env.VITE_API_KEY || "secret";

// --- Types ---

export interface Channel {
  channelId: string;
  name: string | null;
  updatedAt: string;
}

export interface PositionEntry {
  price: number | null;
  size: string | null;
  timestamp: string;
  messageRef: string;
}

export interface TakeProfitLevel {
  price: number | null;
  status: "OPEN" | "HIT";
  portion: string;
}

export interface OpenPosition {
  id: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entries: PositionEntry[];
  stopLoss: number | null;
  takeProfitLevels: TakeProfitLevel[];
  notes: string;
}

export interface ClosedTrade {
  asset: string;
  direction: "LONG" | "SHORT";
  entryAvg: number | null;
  exitAvg: number | null;
  result: "WIN" | "LOSS" | "UNKNOWN";
  pnlPercent: number | null;
  closedAt: string;
}

export interface AssetStats {
  wins: number;
  losses: number;
  totalPnl: number;
}

export interface PortfolioStats {
  totalTrades: number;
  openTradeCount: number;
  wins: number;
  losses: number;
  unknown: number;
  winRate: number | null;
  avgPnlPercent: number;
  totalPnlPercent: number;
  bestTrade: number | null;
  worstTrade: number | null;
  currentStreak: { type: "WIN" | "LOSS" | "NONE"; count: number };
  tradesByAsset: Record<string, AssetStats>;
}

export interface PortfolioOverview {
  channelId: string;
  lastUpdated: string;
  openPositions: OpenPosition[];
  closedTrades: ClosedTrade[];
  stats: PortfolioStats;
}

export interface PortfolioMessage {
  id: number;
  discordMessageId: string | null;
  content: string;
  author: string | null;
  timestamp: string;
}

export interface ProcessingLogEntry {
  id: number;
  discordMessageId: string | null;
  messageContent: string;
  changesSummary: string;
  confidence: number | null;
  confidenceReason: string | null;
  processedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  responseObject: T;
  statusCode: number;
}

interface Paginated<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

// --- Fetch helpers ---

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const data: ApiResponse<T> = await res.json();
  if (!data.success) throw new Error(data.message || "API request failed");
  return data.responseObject;
}

export async function fetchChannels(): Promise<Channel[]> {
  const data = await apiFetch<{ channels: Channel[] }>("/portfolio/channels");
  return data.channels;
}

export async function fetchPortfolioOverview(
  channelId: string
): Promise<PortfolioOverview> {
  return apiFetch(`/portfolio/channels/${channelId}`);
}

export async function fetchMessages(
  channelId: string,
  opts: { limit?: number; offset?: number; author?: string; startDate?: string; endDate?: string } = {}
): Promise<{ messages: PortfolioMessage[] } & Omit<Paginated<never>, "items">> {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.offset != null) params.set("offset", String(opts.offset));
  if (opts.author) params.set("author", opts.author);
  if (opts.startDate) params.set("startDate", opts.startDate);
  if (opts.endDate) params.set("endDate", opts.endDate);
  const qs = params.toString();
  return apiFetch(`/portfolio/channels/${channelId}/messages${qs ? `?${qs}` : ""}`);
}

export async function fetchProcessingLog(
  channelId: string,
  opts: { limit?: number; offset?: number; startDate?: string; endDate?: string } = {}
): Promise<{ entries: ProcessingLogEntry[] } & Omit<Paginated<never>, "items">> {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.offset != null) params.set("offset", String(opts.offset));
  if (opts.startDate) params.set("startDate", opts.startDate);
  if (opts.endDate) params.set("endDate", opts.endDate);
  const qs = params.toString();
  return apiFetch(`/portfolio/channels/${channelId}/processing-log${qs ? `?${qs}` : ""}`);
}

export async function fetchTrades(
  channelId: string,
  opts: { limit?: number; offset?: number; asset?: string; result?: string } = {}
): Promise<{ trades: ClosedTrade[] } & Omit<Paginated<never>, "items">> {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.offset != null) params.set("offset", String(opts.offset));
  if (opts.asset) params.set("asset", opts.asset);
  if (opts.result) params.set("result", opts.result);
  const qs = params.toString();
  return apiFetch(`/portfolio/channels/${channelId}/trades${qs ? `?${qs}` : ""}`);
}
