import type { Stats } from "../types/trade";
import { fmt } from "../utils/trade";

interface StatsGridProps {
  stats: Stats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    {
      label: "FINAL EQUITY",
      value: `$${fmt(stats.finalEquity)}`,
      color: stats.finalEquity >= 10000 ? "#00e5a0" : "#ff5470",
    },
    {
      label: "TOTAL P&L",
      value: `${stats.totalPnl >= 0 ? "+" : ""}$${fmt(stats.totalPnl)}`,
      color: stats.totalPnl >= 0 ? "#00e5a0" : "#ff5470",
    },
    {
      label: "WIN RATE",
      value: `${fmt(stats.winRate, 1)}%`,
      color: stats.winRate >= 50 ? "#00e5a0" : "#ff9f43",
    },
    {
      label: "MAX DRAWDOWN",
      value: `${fmt(stats.maxDD, 1)}%`,
      color: stats.maxDD > 20 ? "#ff5470" : "#ff9f43",
    },
    {
      label: "W / L",
      value: `${stats.wins} / ${stats.losses}`,
      color: "#9ca3b0",
    },
    {
      label: "OPEN POS.",
      value: `${stats.openCount}`,
      color: stats.openCount > 0 ? "#ff9f43" : "#4a5060",
    },
    {
      label: "TOTAL FEES",
      value: `$${fmt(stats.totalFees)}`,
      color: "#ff9f43",
    },
    {
      label: "AVG WIN",
      value: `+$${fmt(stats.avgWin)}`,
      color: "#00e5a0",
    },
    {
      label: "AVG LOSS",
      value: `$${fmt(stats.avgLoss)}`,
      color: "#ff5470",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: 10,
        marginBottom: 28,
      }}
    >
      {cards.map((s) => (
        <div key={s.label} className="stat-card">
          <div
            style={{
              fontSize: 9,
              color: "#8a90a0",
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
  );
}
