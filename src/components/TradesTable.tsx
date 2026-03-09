import type { Trade } from "../types/trade";
import { isOpen, pnl, pct, fmt } from "../utils/trade";

interface TradesTableProps {
  sorted: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: number | string) => void;
}

export default function TradesTable({ sorted, onEdit, onDelete }: TradesTableProps) {
  return (
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
                "DATE", "PAIR", "SIDE", "ENTRY",
                "EXIT", "SIZE", "FEE", "P&L", "RETURN", "",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    color: "#4a5060",
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
            {sorted.map((t) => {
              const p = pnl(t);
              const r = isOpen(t) ? null : pct(t);
              const open = isOpen(t);
              return (
                <tr
                  key={t.id}
                  className="trade-row"
                  style={{
                    borderBottom: "1px solid #12151e",
                    opacity: open ? 0.7 : 1,
                  }}
                >
                  <td style={{ padding: "10px 14px", color: "#9ca3b0", whiteSpace: "nowrap" }}>
                    {t.date}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                    {t.pair}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span
                        style={{
                          background: t.side === "BUY" ? "#00e5a015" : "#ff547015",
                          color: t.side === "BUY" ? "#00e5a0" : "#ff5470",
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {t.side}
                      </span>
                      {open && (
                        <span
                          style={{
                            fontSize: 9,
                            color: "#ff9f43",
                            background: "#ff9f4315",
                            padding: "2px 6px",
                            borderRadius: 3,
                            letterSpacing: "0.08em",
                          }}
                        >
                          OPEN
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#9ca3b0" }}>
                    ${fmt(t.entry)}
                  </td>
                  <td style={{ padding: "10px 14px", color: open ? "#ff9f43" : "#9ca3b0" }}>
                    {open ? "\u2014" : `$${fmt(t.exit!)}`}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#9ca3b0" }}>
                    {t.size}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#ff9f43", fontSize: 11 }}>
                    {t.fee ? `$${fmt(t.fee)}` : "\u2014"}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: open ? "#4a5060" : p! >= 0 ? "#00e5a0" : "#ff5470",
                      fontWeight: 600,
                    }}
                  >
                    {open ? "pending" : `${p! >= 0 ? "+" : ""}$${fmt(p!)}`}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: open ? "#4a5060" : r! >= 0 ? "#00e5a0" : "#ff5470",
                    }}
                  >
                    {open ? "\u2014" : `${r! >= 0 ? "+" : ""}${fmt(r!, 2)}%`}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn"
                        onClick={() => onEdit(t)}
                        style={{ background: "#1e2130", color: "#9ca3b0", padding: "4px 10px" }}
                      >
                        edit
                      </button>
                      <button
                        className="btn"
                        onClick={() => onDelete(t.id)}
                        style={{ background: "#ff547010", color: "#ff5470", padding: "4px 10px" }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!sorted.length && (
              <tr>
                <td
                  colSpan={10}
                  style={{ padding: 40, textAlign: "center", color: "#4a5060" }}
                >
                  No trades — import JSON or add manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
