import type { Trade } from "../types/trade";

export const SAMPLE_TRADES: Trade[] = [
  { id: 1, date: "2024-01-05", pair: "BTC/USDT", side: "BUY", entry: 43200, exit: 47800, size: 0.5, fee: 0, exchange: "" },
  { id: 2, date: "2024-01-18", pair: "BTC/USDT", side: "SELL", entry: 47800, exit: 45200, size: 0.5, fee: 0, exchange: "" },
  { id: 3, date: "2024-02-02", pair: "ETH/USDT", side: "BUY", entry: 2310, exit: 2890, size: 3, fee: 0, exchange: "" },
  { id: 4, date: "2024-02-20", pair: "ETH/USDT", side: "BUY", entry: 2890, exit: 3120, size: 2, fee: 0, exchange: "" },
  { id: 5, date: "2024-03-08", pair: "BTC/USDT", side: "BUY", entry: 62000, exit: 58400, size: 0.25, fee: 0, exchange: "" },
  { id: 6, date: "2024-03-22", pair: "SOL/USDT", side: "BUY", entry: 178, exit: 195, size: 20, fee: 0, exchange: "" },
  { id: 7, date: "2024-04-05", pair: "BTC/USDT", side: "SELL", entry: 58400, exit: 71200, size: 0.3, fee: 0, exchange: "" },
  { id: 8, date: "2024-04-18", pair: "ETH/USDT", side: "SELL", entry: 3120, exit: 2980, size: 1.5, fee: 0, exchange: "" },
];

export const PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "DOGE/USDT",
];

export const SAMPLE_JSON = `[
  {
    "id": "ord_001",
    "date": "2024-05-01T09:00:00Z",
    "exchange": "binance",
    "pair": "BTC/USDT",
    "side": "BUY",
    "entry": 59000,
    "exit": 63400,
    "size": 0.4,
    "fee": 23.60,
    "feeCurrency": "USDT"
  },
  {
    "id": "ord_002",
    "date": "2024-05-12T14:30:00Z",
    "exchange": "binance",
    "pair": "ETH/USDT",
    "side": "BUY",
    "entry": 2950,
    "exit": 3210,
    "size": 2,
    "fee": 5.90,
    "feeCurrency": "USDT"
  },
  {
    "id": "ord_003",
    "date": "2024-05-20T11:15:00Z",
    "exchange": "kraken",
    "pair": "SOL/USDT",
    "side": "SELL",
    "entry": 172,
    "exit": 155,
    "size": 30,
    "fee": 4.89,
    "feeCurrency": "USDT"
  }
]`;

export const EMPTY_TRADE = {
  date: "",
  pair: "BTC/USDT",
  side: "BUY",
  entry: "",
  exit: "",
  size: "",
};
