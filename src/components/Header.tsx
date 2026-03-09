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
        <span style={{ fontSize: 10, color: "#b0b5c0" }}>
          {tradeCount} TRADES LOADED
        </span>
      </div>
    </div>
  );
}
