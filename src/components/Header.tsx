import type { Stats } from "../types/trade";

interface HeaderProps {
  stats: Stats | null;
  tradeCount: number;
}

export default function Header({ stats, tradeCount }: HeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        marginBottom: 32,
      }}
    >
      <h1
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
          letterSpacing: "-0.5px",
        }}
      >
        BACKTEST<span style={{ color: "#00e5a0" }}>.</span>
      </h1>
      <span
        style={{ color: "#4a5060", fontSize: 11, letterSpacing: "0.1em" }}
      >
        STRATEGY SIMULATOR
      </span>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        {stats && stats.openCount > 0 && (
          <span
            style={{
              fontSize: 10,
              color: "#ff9f43",
              background: "#ff9f4315",
              padding: "3px 10px",
              borderRadius: 4,
            }}
          >
            {stats.openCount} OPEN
          </span>
        )}
        <span style={{ fontSize: 10, color: "#4a5060" }}>
          {tradeCount} TRADES LOADED
        </span>
      </div>
    </div>
  );
}
