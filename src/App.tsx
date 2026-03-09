import { useMemo, useState } from "react";
import type { Trade, TradeForm as TradeFormType, ValidationErrors, ImportResult } from "./types/trade";
import { SAMPLE_TRADES, SAMPLE_JSON, EMPTY_TRADE } from "./data/constants";
import { validateTrade, normaliseTrade, isOpen, pnl } from "./utils/trade";
import Header from "./components/Header";
import StatsGrid from "./components/StatsGrid";
import EquityCurve from "./components/EquityCurve";
import TabBar from "./components/TabBar";
import TradesTable from "./components/TradesTable";
import JsonImport from "./components/JsonImport";
import TradeForm from "./components/TradeForm";
import "./App.css";

export default function App() {
  const [trades, setTrades] = useState<Trade[]>(SAMPLE_TRADES);
  const [form, setForm] = useState<TradeFormType>(EMPTY_TRADE);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [tab, setTab] = useState("trades");
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});

  const sorted = useMemo(
    () => [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [trades]
  );

  const stats = useMemo(() => {
    if (!sorted.length) return null;
    let equity = 10000,
      peak = 10000,
      maxDD = 0,
      wins = 0,
      losses = 0,
      totalPnl = 0,
      totalFees = 0;
    const curve: Array<{ date: string; equity: number; pnl?: number; pair?: string; side?: string }> = [
      { date: "Start", equity: 10000 },
    ];
    const openCount = sorted.filter(isOpen).length;

    sorted.forEach((t) => {
      const p = pnl(t);
      if (p === null) return;
      equity += p;
      totalPnl += p;
      totalFees += t.fee || 0;
      if (p >= 0) wins++;
      else losses++;
      if (equity > peak) peak = equity;
      const dd = ((peak - equity) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
      curve.push({
        date: t.date,
        equity: +equity.toFixed(2),
        pnl: +p.toFixed(2),
        pair: t.pair,
        side: t.side,
      });
    });

    const closedCount = wins + losses;
    const winRate = closedCount ? (wins / closedCount) * 100 : 0;
    const avgWin =
      sorted
        .filter((t) => { const p = pnl(t); return p !== null && p > 0; })
        .reduce((s, t) => s + pnl(t)!, 0) / (wins || 1);
    const avgLoss =
      sorted
        .filter((t) => { const p = pnl(t); return p !== null && p < 0; })
        .reduce((s, t) => s + pnl(t)!, 0) / (losses || 1);

    return {
      curve,
      wins,
      losses,
      openCount,
      totalPnl,
      totalFees,
      winRate,
      maxDD,
      avgWin,
      avgLoss,
      finalEquity: equity,
    };
  }, [sorted]);

  function runImport(text: string) {
    setImportResult(null);
    let raw;
    try {
      raw = JSON.parse(text);
      if (!Array.isArray(raw)) raw = [raw];
    } catch (e) {
      setImportResult({ error: `Invalid JSON: ${(e as Error).message}` });
      return;
    }
    const good: Trade[] = [];
    const bad: { index: number; errors: string[]; raw: string }[] = [];
    let incompleteCount = 0;

    raw.forEach((item: unknown, i: number) => {
      const t = normaliseTrade(item, i);
      const { _validation, ...clean } = t;
      if (!_validation.isValid) {
        bad.push({
          index: i,
          errors: Object.values(_validation.errors).filter(Boolean) as string[],
          raw: JSON.stringify(item).slice(0, 80),
        });
      } else {
        if (!_validation.isComplete) incompleteCount++;
        good.push(clean as Trade);
      }
    });

    if (good.length) {
      setTrades((prev) => {
        const ids = new Set(prev.map((t) => String(t.id)));
        return [...prev, ...good.filter((t) => !ids.has(String(t.id)))];
      });
      setTab("trades");
    }
    setImportResult({
      imported: good.length,
      skipped: bad.length,
      incomplete: incompleteCount,
      errors: bad,
    });
  }

  function addTrade() {
    const draft = {
      date: form.date,
      pair: form.pair,
      side: form.side as "BUY" | "SELL",
      entry: +form.entry,
      exit: form.exit ? +form.exit : null,
      size: +form.size,
    };
    const { errors } = validateTrade(draft);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const t: Trade = { ...draft, id: Date.now(), fee: 0, exchange: "" } as Trade;
    if (editId) {
      setTrades(trades.map((x) => (x.id === editId ? { ...t, id: editId } : x)));
      setEditId(null);
    } else {
      setTrades([...trades, t]);
    }
    setForm(EMPTY_TRADE);
    setFormErrors({});
    setTab("trades");
  }

  function startEdit(t: Trade) {
    setForm({
      date: t.date,
      pair: t.pair,
      side: t.side,
      entry: String(t.entry),
      exit: t.exit ? String(t.exit) : "",
      size: String(t.size),
    });
    setEditId(t.id);
    setTab("add");
  }

  return (
    <div className="app-root">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Header stats={stats} tradeCount={trades.length} />

        {stats && <StatsGrid stats={stats} />}

        {stats && stats.curve.length > 1 && (
          <EquityCurve curve={stats.curve} />
        )}

        <TabBar tab={tab} setTab={setTab} editId={editId} />

        {tab === "trades" && (
          <TradesTable
            sorted={sorted}
            onEdit={startEdit}
            onDelete={(id) => setTrades(trades.filter((x) => x.id !== id))}
          />
        )}

        {tab === "import" && (
          <JsonImport
            jsonText={jsonText}
            setJsonText={setJsonText}
            importResult={importResult}
            onImport={runImport}
            onClear={() => {
              setJsonText("");
              setImportResult(null);
            }}
          />
        )}

        {tab === "add" && (
          <TradeForm
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            editId={editId}
            onSubmit={addTrade}
            onCancel={() => {
              setEditId(null);
              setForm(EMPTY_TRADE);
              setTab("trades");
            }}
          />
        )}

        <div
          style={{
            marginTop: 28,
            fontSize: 10,
            color: "#8a90a0",
            letterSpacing: "0.08em",
          }}
        >
          BACKTEST SIMULATOR · STARTING CAPITAL $10,000 · FEES DEDUCTED FROM P&L
          WHERE PROVIDED
        </div>
      </div>
    </div>
  );
}
