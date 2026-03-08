import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "../types/trade";
import { fmt } from "../utils/trade";

interface EquityCurveProps {
  curve: EquityPoint[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EquityPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
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
      <div style={{ color: "#9ca3b0", marginBottom: 4 }}>{d.date}</div>
      <div style={{ color: "#e8eaf0", fontWeight: 600 }}>
        Equity: ${fmt(d.equity)}
      </div>
      {d.pnl !== undefined && (
        <div style={{ color: d.pnl >= 0 ? "#00e5a0" : "#ff5470" }}>
          {d.pnl >= 0 ? "+" : ""}${fmt(d.pnl)} — {d.pair} {d.side}
        </div>
      )}
    </div>
  );
}

export default function EquityCurve({ curve }: EquityCurveProps) {
  return (
    <div
      style={{
        background: "#0f1117",
        border: "1px solid #1e2130",
        borderRadius: 12,
        padding: "20px 16px",
        marginBottom: 28,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#4a5060",
          letterSpacing: "0.12em",
          marginBottom: 16,
        }}
      >
        EQUITY CURVE — starting $10,000
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={curve}>
          <XAxis
            dataKey="date"
            tick={{ fill: "#4a5060", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#4a5060", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
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
