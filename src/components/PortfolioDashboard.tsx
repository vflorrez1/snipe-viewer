import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  PortfolioOverview,
  PortfolioMessage,
  ProcessingLogEntry,
  ClosedTrade,
  OpenPosition,
  PortfolioStats,
  Channel,
} from "../api/portfolio";
import {
  fetchChannels,
  fetchPortfolioOverview,
  fetchMessages,
  fetchProcessingLog,
  fetchTrades,
} from "../api/portfolio";
import PositionChart from "./PositionChart";

export type PortfolioSubTab =
  | "overview"
  | "positions"
  | "trades"
  | "messages"
  | "log";

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export const PORTFOLIO_SUB_TABS: { key: PortfolioSubTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "positions", label: "Open Positions" },
  { key: "trades", label: "Closed Trades" },
  { key: "messages", label: "Messages" },
  { key: "log", label: "Processing Log" },
];

const PAGE_SIZE = 20;

interface PortfolioDashboardProps {
  subTab: PortfolioSubTab;
  setSubTab: (tab: PortfolioSubTab) => void;
}

export default function PortfolioDashboard({
  subTab,
  setSubTab,
}: PortfolioDashboardProps) {
  const isMobile = useIsMobile();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState("");
  const [loading, setLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overview data
  const [overview, setOverview] = useState<PortfolioOverview | null>(null);

  // Paginated data
  const [messages, setMessages] = useState<PortfolioMessage[]>([]);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [messagesOffset, setMessagesOffset] = useState(0);

  const [logEntries, setLogEntries] = useState<ProcessingLogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logOffset, setLogOffset] = useState(0);

  // Date filters
  const [messagesStartDate, setMessagesStartDate] = useState("");
  const [messagesEndDate, setMessagesEndDate] = useState("");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");

  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const [tradesTotal, setTradesTotal] = useState(0);
  const [tradesOffset, setTradesOffset] = useState(0);
  const [tradeFilterAsset, setTradeFilterAsset] = useState("");
  const [tradeFilterResult, setTradeFilterResult] = useState("");

  const loadMessages = useCallback(
    async (
      id: string,
      offset: number,
      startDate?: string,
      endDate?: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMessages(id, {
          limit: PAGE_SIZE,
          offset,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setMessages(data.messages);
        setMessagesTotal(data.total);
        setMessagesOffset(offset);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadLog = useCallback(
    async (
      id: string,
      offset: number,
      startDate?: string,
      endDate?: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProcessingLog(id, {
          limit: PAGE_SIZE,
          offset,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setLogEntries(data.entries);
        setLogTotal(data.total);
        setLogOffset(offset);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadTrades = useCallback(
    async (id: string, offset: number, asset?: string, result?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTrades(id, {
          limit: PAGE_SIZE,
          offset,
          asset: asset || undefined,
          result: result || undefined,
        });
        setTrades(data.trades);
        setTradesTotal(data.total);
        setTradesOffset(offset);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Load channels on mount, auto-select the first one
  useEffect(() => {
    fetchChannels()
      .then((chs) => {
        setChannels(chs);
        if (chs.length > 0) {
          setActiveChannel(chs[0].channelId);
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setChannelsLoading(false));
  }, []);

  // Load all data when channel changes (not on tab switch)
  const loadAll = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, messagesData, logData, tradesData] =
        await Promise.all([
          fetchPortfolioOverview(id),
          fetchMessages(id, { limit: PAGE_SIZE, offset: 0 }),
          fetchProcessingLog(id, { limit: PAGE_SIZE, offset: 0 }),
          fetchTrades(id, { limit: PAGE_SIZE, offset: 0 }),
        ]);
      setOverview(overviewData);
      setMessages(messagesData.messages);
      setMessagesTotal(messagesData.total);
      setMessagesOffset(0);
      setLogEntries(logData.entries);
      setLogTotal(logData.total);
      setLogOffset(0);
      setTrades(tradesData.trades);
      setTradesTotal(tradesData.total);
      setTradesOffset(0);
      setTradeFilterAsset("");
      setTradeFilterResult("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeChannel) loadAll(activeChannel);
  }, [activeChannel, loadAll]);

  const subTabs = PORTFOLIO_SUB_TABS;

  return (
    <div style={{ paddingTop: isMobile ? 18 : 0 }}>
      {/* Channel selector — sticky header */}
      <div
        style={{
          position: "sticky",
          top: isMobile ? 44 : 0,
          zIndex: 10,
          background: "#080a0f",
          paddingTop: isMobile ? 8 : 8,
          paddingBottom: 20,
          borderBottom: "1px solid #1e2130",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 4 : 10,
            alignItems: isMobile ? "flex-start" : "center",
          }}
        >
          {channelsLoading ? (
            <span style={{ fontSize: 12, color: "#b0b5c0" }}>
              Loading channels...
            </span>
          ) : channels.length === 0 ? (
            <span style={{ fontSize: 12, color: "#9ca3b0" }}>
              No channels available.
            </span>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "#b0b5c0",
                    whiteSpace: "nowrap",
                  }}
                >
                  CHANNEL
                </label>
                {channels.length === 1 ? (
                  <span
                    style={{ fontSize: 12, color: "#00e5a0", fontWeight: 600 }}
                  >
                    {channels[0].name || channels[0].channelId}
                  </span>
                ) : (
                  <select
                    value={activeChannel}
                    onChange={(e) => {
                      setActiveChannel(e.target.value);
                      setSubTab("overview");
                    }}
                    style={{ maxWidth: 280 }}
                  >
                    {channels.map((ch) => (
                      <option key={ch.channelId} value={ch.channelId}>
                        {ch.name || ch.channelId}
                      </option>
                    ))}
                  </select>
                )}
                {!isMobile && (
                  <button
                    className="btn"
                    onClick={() => loadAll(activeChannel)}
                    disabled={loading}
                    style={{
                      background: "#1e2130",
                      color: loading ? "#555" : "#9ca3b0",
                      padding: "6px 14px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                )}
              </div>
              {overview && (
                <span style={{ fontSize: 11, color: "#9ca3b0" }}>
                  Last updated:{" "}
                  {new Date(overview.lastUpdated).toLocaleString()}
                </span>
              )}
            </>
          )}
        </div>

        {error && (
          <div
            style={{
              background: "#ff547015",
              border: "1px solid #ff5470",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#ff5470",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {activeChannel && (
          <>
            {/* Sub-tab bar (hidden on mobile — FAB handles it) */}
            <div
              className="desktop-only"
              style={{
                display: "flex",
                gap: 4,
                background: "#0f1117",
                borderRadius: 8,
                padding: 4,
                width: "fit-content",
                border: "1px solid #1e2130",
              }}
            >
              {subTabs.map((t) => (
                <button
                  key={t.key}
                  className="tab-btn"
                  onClick={() => setSubTab(t.key)}
                  style={{
                    color: subTab === t.key ? "#080a0f" : "#b0b5c0",
                    background: subTab === t.key ? "#00e5a0" : "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {activeChannel && (
        <>
          {loading && (
            <div style={{ padding: 32, textAlign: "center", color: "#b0b5c0" }}>
              Loading...
            </div>
          )}

          {!loading && subTab === "overview" && overview && (
            <StatsOverview
              stats={overview.stats}
              closedTrades={overview.closedTrades}
              onOpenPositionsClick={() => setSubTab("positions")}
            />
          )}

          {!loading && subTab === "positions" && overview && (
            <OpenPositionsTable positions={overview.openPositions} channelId={activeChannel} />
          )}

          {!loading && subTab === "trades" && (
            <ClosedTradesView
              trades={trades}
              total={tradesTotal}
              offset={tradesOffset}
              assetFilter={tradeFilterAsset}
              resultFilter={tradeFilterResult}
              onAssetFilter={(v) => {
                setTradeFilterAsset(v);
                loadTrades(activeChannel, 0, v, tradeFilterResult);
              }}
              onResultFilter={(v) => {
                setTradeFilterResult(v);
                loadTrades(activeChannel, 0, tradeFilterAsset, v);
              }}
              onPage={(offset) =>
                loadTrades(
                  activeChannel,
                  offset,
                  tradeFilterAsset,
                  tradeFilterResult,
                )
              }
            />
          )}

          {!loading && subTab === "messages" && (
            <MessagesView
              messages={messages}
              total={messagesTotal}
              offset={messagesOffset}
              onPage={(offset) =>
                loadMessages(
                  activeChannel,
                  offset,
                  messagesStartDate,
                  messagesEndDate,
                )
              }
              startDate={messagesStartDate}
              endDate={messagesEndDate}
              onDateChange={(start, end) => {
                setMessagesStartDate(start);
                setMessagesEndDate(end);
                loadMessages(activeChannel, 0, start, end);
              }}
              onClearFilter={() => {
                setMessagesStartDate("");
                setMessagesEndDate("");
                loadMessages(activeChannel, 0);
              }}
            />
          )}

          {!loading && subTab === "log" && (
            <ProcessingLogView
              entries={logEntries}
              total={logTotal}
              offset={logOffset}
              onPage={(offset) =>
                loadLog(activeChannel, offset, logStartDate, logEndDate)
              }
              startDate={logStartDate}
              endDate={logEndDate}
              onDateChange={(start, end) => {
                setLogStartDate(start);
                setLogEndDate(end);
                loadLog(activeChannel, 0, start, end);
              }}
              onClearFilter={() => {
                setLogStartDate("");
                setLogEndDate("");
                loadLog(activeChannel, 0);
              }}
            />
          )}
        </>
      )}

      {/* Mobile refresh FAB */}
      {isMobile && activeChannel && (
        <button
          onClick={() => loadAll(activeChannel)}
          disabled={loading}
          style={{
            position: "fixed",
            bottom: 24,
            left: 24,
            zIndex: 999,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: loading ? "#1e2130" : "#0f1117",
            border: "1px solid #1e2130",
            color: loading ? "#555" : "#9ca3b0",
            fontSize: 18,
            cursor: loading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            animation: loading ? "spin 1s linear infinite" : "none",
          }}
          title="Refresh"
        >
          &#x21bb;
        </button>
      )}
    </div>
  );
}

// --- Sub-components ---

function PortfolioEquityCurve({
  closedTrades,
}: {
  closedTrades: ClosedTrade[];
}) {
  const curve = useMemo(() => {
    const sorted = [...closedTrades].sort(
      (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime(),
    );
    let equity = 10000;
    const points = [{ date: "Start", equity: 10000, pnl: 0, asset: "" }];
    for (const t of sorted) {
      if (t.pnlPercent == null) continue;
      const pnl = equity * (t.pnlPercent / 100);
      equity += pnl;
      points.push({
        date: new Date(t.closedAt).toLocaleDateString(),
        equity: +equity.toFixed(2),
        pnl: +pnl.toFixed(2),
        asset: t.asset,
      });
    }

    // Demo data when not enough real trades
    if (points.length < 2) {
      const demo = [
        { asset: "BTC", pnl: 3.2 },
        { asset: "ETH", pnl: -1.5 },
        { asset: "SOL", pnl: 5.8 },
        { asset: "BTC", pnl: -2.1 },
        { asset: "DOGE", pnl: 4.4 },
        { asset: "ETH", pnl: 1.9 },
        { asset: "SOL", pnl: -3.6 },
        { asset: "BTC", pnl: 6.1 },
        { asset: "AVAX", pnl: -0.8 },
        { asset: "ETH", pnl: 2.7 },
        { asset: "BTC", pnl: 3.5 },
        { asset: "SOL", pnl: -1.2 },
      ];
      let eq = 10000;
      const demoPoints = [{ date: "Start", equity: 10000, pnl: 0, asset: "" }];
      const baseDate = new Date("2026-03-01");
      for (let i = 0; i < demo.length; i++) {
        const d = demo[i];
        const tradePnl = eq * (d.pnl / 100);
        eq += tradePnl;
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + (i + 1) * 2);
        demoPoints.push({
          date: date.toLocaleDateString(),
          equity: +eq.toFixed(2),
          pnl: +tradePnl.toFixed(2),
          asset: d.asset,
        });
      }
      return { points: demoPoints, isDemo: true };
    }

    return { points, isDemo: false };
  }, [closedTrades]);

  if (curve.points.length < 2) return null;

  return (
    <div
      style={{
        background: "#0f1117",
        border: "1px solid #1e2130",
        borderRadius: 12,
        padding: "20px 16px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#b0b5c0",
          letterSpacing: "0.12em",
          marginBottom: 16,
        }}
      >
        EQUITY CURVE — starting $10,000
        {curve.isDemo && (
          <span style={{ color: "#ff9f43", marginLeft: 12 }}>DEMO DATA</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={curve.points}
          margin={{ left: -15, right: 10, top: 15, bottom: 5 }}
        >
          <XAxis
            dataKey="date"
            tick={{ fill: "#b0b5c0", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#b0b5c0", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof curve.points)[0];
              return (
                <div
                  style={{
                    background: "#0f1117",
                    border: "1px solid #2a2d3a",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 12,
                  }}
                >
                  <div style={{ color: "#9ca3b0", marginBottom: 4 }}>
                    {d.date}
                  </div>
                  <div style={{ color: "#e8eaf0", fontWeight: 600 }}>
                    Equity: ${d.equity.toLocaleString()}
                  </div>
                  {d.asset && (
                    <div style={{ color: d.pnl >= 0 ? "#00e5a0" : "#ff5470" }}>
                      {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(2)} — {d.asset}
                    </div>
                  )}
                </div>
              );
            }}
          />
          <ReferenceLine y={10000} stroke="#2a2d3a" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="equity"
            stroke="#00e5a0"
            strokeWidth={2}
            dot={{ fill: "#00e5a0", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatsOverview({
  stats,
  closedTrades,
  onOpenPositionsClick,
}: {
  stats: PortfolioStats;
  closedTrades: ClosedTrade[];
  onOpenPositionsClick?: () => void;
}) {
  const cards: { label: string; value: string; color: string; onClick?: () => void }[] = [
    {
      label: "TOTAL TRADES",
      value: String(stats.totalTrades),
      color: "#9ca3b0",
    },
    {
      label: "OPEN POSITIONS",
      value: String(stats.openTradeCount),
      color: stats.openTradeCount > 0 ? "#ff9f43" : "#b0b5c0",
      onClick: onOpenPositionsClick,
    },
    {
      label: "WIN RATE",
      value: stats.winRate != null ? `${stats.winRate.toFixed(1)}%` : "--",
      color:
        stats.winRate != null && stats.winRate >= 50 ? "#00e5a0" : "#ff9f43",
    },
    {
      label: "W / L",
      value: `${stats.wins} / ${stats.losses}`,
      color: "#9ca3b0",
    },
    {
      label: "TOTAL PNL",
      value: `${stats.totalPnlPercent >= 0 ? "+" : ""}${stats.totalPnlPercent.toFixed(2)}%`,
      color: stats.totalPnlPercent >= 0 ? "#00e5a0" : "#ff5470",
    },
    {
      label: "AVG PNL",
      value: `${stats.avgPnlPercent >= 0 ? "+" : ""}${stats.avgPnlPercent.toFixed(2)}%`,
      color: stats.avgPnlPercent >= 0 ? "#00e5a0" : "#ff5470",
    },
    {
      label: "BEST TRADE",
      value: stats.bestTrade != null ? `+${stats.bestTrade.toFixed(2)}%` : "--",
      color: "#00e5a0",
    },
    {
      label: "WORST TRADE",
      value:
        stats.worstTrade != null ? `${stats.worstTrade.toFixed(2)}%` : "--",
      color: "#ff5470",
    },
    {
      label: "STREAK",
      value:
        stats.currentStreak.type === "NONE"
          ? "--"
          : `${stats.currentStreak.count} ${stats.currentStreak.type}`,
      color:
        stats.currentStreak.type === "WIN"
          ? "#00e5a0"
          : stats.currentStreak.type === "LOSS"
            ? "#ff5470"
            : "#b0b5c0",
    },
  ];

  const assetEntries = Object.entries(stats.tradesByAsset);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {cards.map((s) => (
          <div
            key={s.label}
            className="stat-card"
            onClick={s.onClick}
            style={s.onClick ? { cursor: "pointer" } : undefined}
          >
            <div
              style={{
                fontSize: 9,
                color: "#b0b5c0",
                letterSpacing: "0.12em",
                marginBottom: 8,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <PortfolioEquityCurve closedTrades={closedTrades} />

      {assetEntries.length > 0 && (
        <div
          style={{
            background: "#0f1117",
            border: "1px solid #1e2130",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              fontSize: 10,
              color: "#b0b5c0",
              letterSpacing: "0.1em",
              borderBottom: "1px solid #1e2130",
            }}
          >
            PERFORMANCE BY ASSET
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #1e2130" }}>
                  {["ASSET", "WINS", "LOSSES", "TOTAL PNL %"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        color: "#b0b5c0",
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assetEntries.map(([asset, data]) => (
                  <tr key={asset} style={{ borderBottom: "1px solid #12151e" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                      {asset}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#00e5a0" }}>
                      {data.wins}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#ff5470" }}>
                      {data.losses}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: data.totalPnl >= 0 ? "#00e5a0" : "#ff5470",
                        fontWeight: 600,
                      }}
                    >
                      {data.totalPnl >= 0 ? "+" : ""}
                      {data.totalPnl.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function OpenPositionsTable({ positions, channelId }: { positions: OpenPosition[]; channelId: string }) {
  const [chartPositionId, setChartPositionId] = useState<string | null>(null);

  if (!positions.length) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#b0b5c0" }}>
        No open positions.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      {chartPositionId && (
        <PositionChart
          channelId={channelId}
          positionId={chartPositionId}
          onClose={() => setChartPositionId(null)}
        />
      )}
      {positions.map((pos) => (
        <div
          key={pos.id}
          className="stat-card"
          style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
          onClick={() => setChartPositionId(pos.id)}
        >
          {/* Position header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              borderBottom: "1px solid #1e2130",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>{pos.asset}</span>
            <span
              style={{
                background:
                  pos.direction === "LONG" ? "#00e5a015" : "#ff547015",
                color: pos.direction === "LONG" ? "#00e5a0" : "#ff5470",
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {pos.direction}
            </span>
            {pos.stopLoss != null && (
              <span style={{ fontSize: 11, color: "#ff5470" }}>
                SL: ${pos.stopLoss}
              </span>
            )}
          </div>

          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Entries */}
            {pos.entries.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#6b7080",
                    letterSpacing: "0.1em",
                    marginBottom: 10,
                  }}
                >
                  ENTRIES
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pos.entries.map((e, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#0d0f14",
                        borderRadius: 8,
                        padding: "10px 12px",
                        borderLeft: "3px solid #5b8def",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf0", marginBottom: 4 }}>
                        {e.price != null ? `$${e.price}` : "Limit (unfilled)"}
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6b7080" }}>
                        {e.size && e.size !== "unknown" && (
                          <span>Size: {e.size}</span>
                        )}
                        <span>{new Date(e.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        <span>{new Date(e.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Take profit levels */}
            {pos.takeProfitLevels.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#6b7080",
                    letterSpacing: "0.1em",
                    marginBottom: 10,
                  }}
                >
                  TAKE PROFIT
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {pos.takeProfitLevels.map((tp, i) => (
                    <span
                      key={i}
                      style={{
                        background:
                          tp.status === "HIT" ? "#00e5a015" : "#1e2130",
                        border: `1px solid ${tp.status === "HIT" ? "#00e5a040" : "#2a2d3a"}`,
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 12,
                        color: tp.status === "HIT" ? "#00e5a0" : "#b0b5c0",
                        fontWeight: 500,
                      }}
                    >
                      {tp.price != null ? `$${tp.price}` : "--"}
                      {tp.portion && tp.portion !== "unknown" && (
                        <span style={{ color: "#6b7080", fontWeight: 400, marginLeft: 4, fontSize: 10 }}>
                          {tp.portion}
                        </span>
                      )}
                      {tp.status === "HIT" && (
                        <span style={{ marginLeft: 4 }}>{"\u2713"}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {pos.notes && (
              <div
                style={{
                  background: "#0d0f14",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 11,
                  color: "#7a8090",
                  lineHeight: 1.6,
                }}
              >
                {pos.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  total,
  offset,
  pageSize,
  onPage,
}: {
  total: number;
  offset: number;
  pageSize: number;
  onPage: (offset: number) => void;
}) {
  if (total <= pageSize) return null;
  const page = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "16px 0",
        fontSize: 12,
        color: "#b0b5c0",
      }}
    >
      <button
        className="btn"
        disabled={offset === 0}
        onClick={() => onPage(Math.max(0, offset - pageSize))}
        style={{
          background: "#1e2130",
          color: offset === 0 ? "#555" : "#9ca3b0",
          padding: "4px 12px",
        }}
      >
        Prev
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        className="btn"
        disabled={offset + pageSize >= total}
        onClick={() => onPage(offset + pageSize)}
        style={{
          background: "#1e2130",
          color: offset + pageSize >= total ? "#555" : "#9ca3b0",
          padding: "4px 12px",
        }}
      >
        Next
      </button>
    </div>
  );
}

function ClosedTradesView({
  trades,
  total,
  offset,
  assetFilter,
  resultFilter,
  onAssetFilter,
  onResultFilter,
  onPage,
}: {
  trades: ClosedTrade[];
  total: number;
  offset: number;
  assetFilter: string;
  resultFilter: string;
  onAssetFilter: (v: string) => void;
  onResultFilter: (v: string) => void;
  onPage: (offset: number) => void;
}) {
  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Filter by asset..."
          value={assetFilter}
          onChange={(e) => onAssetFilter(e.target.value)}
          style={{ maxWidth: 180 }}
        />
        <select
          value={resultFilter}
          onChange={(e) => onResultFilter(e.target.value)}
          style={{ maxWidth: 140 }}
        >
          <option value="">All Results</option>
          <option value="WIN">WIN</option>
          <option value="LOSS">LOSS</option>
          <option value="UNKNOWN">UNKNOWN</option>
        </select>
        <span style={{ fontSize: 11, color: "#9ca3b0", alignSelf: "center" }}>
          {total} trades
        </span>
      </div>

      <div
        style={{
          background: "#0f1117",
          border: "1px solid #1e2130",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2130" }}>
                {[
                  "ASSET",
                  "DIRECTION",
                  "ENTRY AVG",
                  "EXIT AVG",
                  "RESULT",
                  "PNL %",
                  "CLOSED",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      color: "#b0b5c0",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr
                  key={i}
                  className="trade-row"
                  style={{ borderBottom: "1px solid #12151e" }}
                >
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                    {t.asset}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        background:
                          t.direction === "LONG" ? "#00e5a015" : "#ff547015",
                        color: t.direction === "LONG" ? "#00e5a0" : "#ff5470",
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {t.direction}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#9ca3b0" }}>
                    {t.entryAvg != null ? `$${t.entryAvg}` : "--"}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#9ca3b0" }}>
                    {t.exitAvg != null ? `$${t.exitAvg}` : "--"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        color:
                          t.result === "WIN"
                            ? "#00e5a0"
                            : t.result === "LOSS"
                              ? "#ff5470"
                              : "#ff9f43",
                        fontWeight: 600,
                      }}
                    >
                      {t.result}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color:
                        t.pnlPercent != null && t.pnlPercent >= 0
                          ? "#00e5a0"
                          : "#ff5470",
                      fontWeight: 600,
                    }}
                  >
                    {t.pnlPercent != null
                      ? `${t.pnlPercent >= 0 ? "+" : ""}${t.pnlPercent.toFixed(2)}%`
                      : "--"}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "#9ca3b0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(t.closedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!trades.length && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#b0b5c0",
                    }}
                  >
                    No closed trades found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          total={total}
          offset={offset}
          pageSize={PAGE_SIZE}
          onPage={onPage}
        />
      </div>
    </div>
  );
}

function DatePickerButton({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 9, color: "#9ca3b0", letterSpacing: "0.1em" }}>
        {label}
      </span>
      <span
        style={{
          background: value ? "#1e2130" : "transparent",
          border: `1px solid ${value ? "#3a3d4a" : "#2a2d3a"}`,
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: 11,
          color: value ? "#ffffff" : "#9ca3b0",
          fontFamily: "inherit",
          minWidth: 80,
          textAlign: "center",
        }}
      >
        {value || "None"}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.preventDefault()}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          cursor: "pointer",
          width: "100%",
          height: "100%",
        }}
      />
    </label>
  );
}

function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  onClear,
}: {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <DatePickerButton
        label="FROM"
        value={startDate}
        onChange={(v) => onChange(v, endDate)}
      />
      <DatePickerButton
        label="TO"
        value={endDate}
        onChange={(v) => onChange(startDate, v)}
      />
      {(startDate || endDate) && (
        <button
          className="btn"
          onClick={onClear}
          style={{
            background: "#1e2130",
            color: "#9ca3b0",
            padding: "4px 10px",
            fontSize: 10,
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}

function MessagesView({
  messages,
  total,
  offset,
  onPage,
  startDate,
  endDate,
  onDateChange,
  onClearFilter,
}: {
  messages: PortfolioMessage[];
  total: number;
  offset: number;
  onPage: (offset: number) => void;
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  onClearFilter: () => void;
}) {
  return (
    <div>
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onChange={onDateChange}
        onClear={onClearFilter}
      />
      <div style={{ fontSize: 11, color: "#9ca3b0", marginBottom: 12 }}>
        {total} messages
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            className="stat-card"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 12, color: "#00e5a0" }}>
                {m.author || "Unknown"}
              </span>
              <span style={{ fontSize: 10, color: "#9ca3b0" }}>
                {new Date(m.timestamp).toLocaleString()}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#e8eaf0",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {!messages.length && (
          <div style={{ padding: 40, textAlign: "center", color: "#b0b5c0" }}>
            No messages found.
          </div>
        )}
      </div>
      <Pagination
        total={total}
        offset={offset}
        pageSize={PAGE_SIZE}
        onPage={onPage}
      />
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value == null) return <span style={{ color: "#9ca3b0" }}>--</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#00e5a0" : pct >= 50 ? "#ff9f43" : "#ff5470";
  return (
    <span
      style={{
        background: `${color}15`,
        color,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {pct}%
    </span>
  );
}

function ProcessingLogView({
  entries,
  total,
  offset,
  onPage,
  startDate,
  endDate,
  onDateChange,
  onClearFilter,
}: {
  entries: ProcessingLogEntry[];
  total: number;
  offset: number;
  onPage: (offset: number) => void;
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  onClearFilter: () => void;
}) {
  const [minConfidence, setMinConfidence] = useState<string>("");

  const filtered = minConfidence
    ? entries.filter(
        (e) => e.confidence != null && e.confidence >= Number(minConfidence),
      )
    : entries;

  return (
    <div>
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onChange={onDateChange}
        onClear={onClearFilter}
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{ fontSize: 10, color: "#b0b5c0", letterSpacing: "0.1em" }}
        >
          MIN CONFIDENCE
        </label>
        <select
          value={minConfidence}
          onChange={(e) => setMinConfidence(e.target.value)}
          style={{ maxWidth: 120 }}
        >
          <option value="">All</option>
          <option value="0.2">20%+</option>
          <option value="0.4">40%+</option>
          <option value="0.5">50%+</option>
          <option value="0.6">60%+</option>
          <option value="0.8">80%+</option>
          <option value="0.9">90%+</option>
        </select>
        <span style={{ fontSize: 11, color: "#9ca3b0" }}>
          {filtered.length} of {total} entries
        </span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map((e) => (
          <div
            key={e.id}
            className="stat-card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            {/* Header row */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "10px 14px",
                borderBottom: "1px solid #1e2130",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ConfidenceBadge value={e.confidence} />
                <span style={{ fontSize: 10, color: "#9ca3b0" }}>
                  {new Date(e.processedAt).toLocaleString()}
                </span>
              </div>
              {e.confidenceReason && (
                <span
                  style={{ fontSize: 11, color: "#9ca3b0", lineHeight: 1.4 }}
                >
                  {e.confidenceReason}
                </span>
              )}
            </div>

            <div style={{ padding: "10px 14px" }}>
              {/* Changes summary */}
              <div
                style={{
                  fontSize: 12,
                  color: "#00e5a0",
                  marginBottom: 8,
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {e.changesSummary}
              </div>

              {/* Original message */}
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3b0",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "#080a0f",
                  borderRadius: 6,
                  padding: "8px 12px",
                }}
              >
                {e.messageContent}
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div style={{ padding: 40, textAlign: "center", color: "#b0b5c0" }}>
            No processing log entries found.
          </div>
        )}
      </div>
      <Pagination
        total={total}
        offset={offset}
        pageSize={PAGE_SIZE}
        onPage={onPage}
      />
    </div>
  );
}
