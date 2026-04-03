import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PositionChartData,
  Timeframe,
} from "../api/portfolio";
import { fetchPositionChart } from "../api/portfolio";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

interface Props {
  channelId: string;
  positionId: string;
  onClose: () => void;
}

export default function PositionChart({ channelId, positionId, onClose }: Props) {
  const [data, setData] = useState<PositionChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chart = await fetchPositionChart(channelId, positionId, timeframe);
      setData(chart);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [channelId, positionId, timeframe]);

  useEffect(() => { load(); }, [load]);

  // Draw candlestick chart on canvas
  useEffect(() => {
    if (!data || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const isMobile = width < 500;
    const height = isMobile ? 320 : 420;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const { candles, overlays } = data;
    if (!candles.length) return;

    const fontSize = isMobile ? 9 : 10;
    const font = `${fontSize}px 'IBM Plex Mono', monospace`;

    // Layout — on mobile, labels go inside the chart so right padding is minimal
    const padding = {
      top: 16,
      right: isMobile ? 8 : 80,
      bottom: isMobile ? 32 : 40,
      left: 8,
    };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Price range (include overlays)
    const allPrices: number[] = [];
    for (const c of candles) { allPrices.push(c.high, c.low); }
    for (const e of overlays.entries) { if (e.price != null) allPrices.push(e.price); }
    if (overlays.stopLoss != null) allPrices.push(overlays.stopLoss);
    for (const tp of overlays.takeProfitLevels) { if (tp.price != null) allPrices.push(tp.price); }
    if (overlays.currentPrice != null) allPrices.push(overlays.currentPrice);

    const priceMin = Math.min(...allPrices);
    const priceMax = Math.max(...allPrices);
    const priceRange = priceMax - priceMin || 1;
    const pricePad = priceRange * 0.05;
    const yMin = priceMin - pricePad;
    const yMax = priceMax + pricePad;

    const toY = (price: number) =>
      padding.top + chartH * (1 - (price - yMin) / (yMax - yMin));
    const toX = (i: number) =>
      padding.left + (i + 0.5) * (chartW / candles.length);

    // Clear
    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, width, height);

    // Grid lines — fewer on mobile
    const gridLines = isMobile ? 4 : 6;
    ctx.strokeStyle = "#1e2130";
    ctx.lineWidth = 1;
    ctx.font = font;
    ctx.fillStyle = "#6b7080";
    ctx.textAlign = "right";

    for (let i = 0; i <= gridLines; i++) {
      const price = yMin + (yMax - yMin) * (i / gridLines);
      const y = toY(price);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      if (!isMobile) {
        ctx.fillText(formatPrice(price, false), width - padding.right + 6, y + 3);
      }
    }

    // X-axis labels — fewer on mobile, shorter format
    ctx.textAlign = "center";
    ctx.fillStyle = "#6b7080";
    const maxLabels = isMobile ? 4 : 8;
    const labelInterval = Math.max(1, Math.floor(candles.length / maxLabels));
    for (let i = 0; i < candles.length; i += labelInterval) {
      const x = toX(i);
      const d = new Date(candles[i].timestamp);
      const label = formatTimeLabel(d, data.timeframe, isMobile);
      ctx.fillText(label, x, height - padding.bottom + (isMobile ? 12 : 16));
    }

    // Candles
    const candleW = Math.max(1, (chartW / candles.length) * 0.6);

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const x = toX(i);
      const isGreen = c.close >= c.open;
      const color = isGreen ? "#00e5a0" : "#ff5470";

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    }

    // --- Overlays ---

    // Collect all overlay labels with their Y positions to avoid collisions
    const overlayLabels: { y: number; price: number; color: string; label: string; dashed: boolean; dimmed: boolean }[] = [];

    for (const entry of overlays.entries) {
      if (entry.price == null) continue;
      overlayLabels.push({ y: toY(entry.price), price: entry.price, color: "#5b8def", label: isMobile ? "E" : entry.label, dashed: false, dimmed: false });
    }
    if (overlays.stopLoss != null) {
      overlayLabels.push({ y: toY(overlays.stopLoss), price: overlays.stopLoss, color: "#ff5470", label: "SL", dashed: false, dimmed: false });
    }
    for (let i = 0; i < overlays.takeProfitLevels.length; i++) {
      const tp = overlays.takeProfitLevels[i];
      if (tp.price == null) continue;
      const isHit = tp.status === "HIT";
      overlayLabels.push({
        y: toY(tp.price),
        price: tp.price,
        color: "#00e5a0",
        label: isHit ? `TP${i + 1}\u2713` : `TP${i + 1}`,
        dashed: isHit,
        dimmed: isHit,
      });
    }
    if (overlays.currentPrice != null) {
      overlayLabels.push({ y: toY(overlays.currentPrice), price: overlays.currentPrice, color: "#ff9f43", label: isMobile ? "Now" : "Price", dashed: true, dimmed: false });
    }

    // Sort by Y and nudge overlapping labels
    overlayLabels.sort((a, b) => a.y - b.y);
    const minGap = fontSize + 4;
    for (let i = 1; i < overlayLabels.length; i++) {
      const prev = overlayLabels[i - 1];
      const curr = overlayLabels[i];
      if (curr.y - prev.y < minGap) {
        // Push current label down
        const adjustedY = prev.y + minGap;
        curr.y = adjustedY;
      }
    }

    // Pass 1: draw all overlay lines
    for (const ol of overlayLabels) {
      const lineY = toY(ol.price);
      ctx.strokeStyle = ol.dimmed ? ol.color + "60" : ol.color;
      ctx.lineWidth = 1;
      ctx.setLineDash(ol.dashed ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(padding.left, lineY);
      ctx.lineTo(width - padding.right, lineY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Pass 2: draw all labels on top of lines
    for (const ol of overlayLabels) {
      ctx.font = font;
      const priceStr = formatPrice(ol.price, isMobile);
      const text = `${ol.label} ${priceStr}`;
      const textW = ctx.measureText(text).width;
      const pillH = fontSize + 5;
      const pillW = textW + 8;
      const pillR = 3;

      if (isMobile) {
        // Inline pill: anchored to right edge of chart area, sitting on the line
        const pillX = width - padding.right - pillW - 4;
        const pillY = ol.y - pillH / 2;
        // Opaque base to fully cover lines, then tinted overlay
        ctx.fillStyle = "#0f1117";
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
        ctx.fill();
        const bgColor = ol.dimmed ? ol.color + "18" : ol.color + "20";
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
        ctx.fill();
        // Border
        ctx.strokeStyle = ol.dimmed ? ol.color + "40" : ol.color + "60";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
        ctx.stroke();
        // Text
        ctx.fillStyle = ol.dimmed ? ol.color + "80" : ol.color;
        ctx.textAlign = "left";
        ctx.fillText(text, pillX + 4, ol.y + fontSize / 2 - 2);
      } else {
        // Desktop: label in right margin
        ctx.textAlign = "left";
        const labelX = width - padding.right + 4;
        ctx.fillStyle = "#0f1117";
        ctx.fillRect(labelX - 2, ol.y - (fontSize / 2) - 2, textW + 6, fontSize + 4);
        ctx.fillStyle = ol.dimmed ? ol.color + "80" : ol.color;
        ctx.fillText(text, labelX, ol.y + fontSize / 2 - 2);
      }
    }

    // Entry markers (triangles on candles)
    for (const entry of overlays.entries) {
      if (entry.price == null) continue;
      const entryTs = new Date(entry.timestamp).getTime();
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < candles.length; i++) {
        const dist = Math.abs(candles[i].timestamp - entryTs);
        if (dist < minDist) { minDist = dist; closest = i; }
      }
      const x = toX(closest);
      const y = toY(entry.price);
      const sz = isMobile ? 4 : 5;
      ctx.fillStyle = "#5b8def";
      ctx.beginPath();
      ctx.moveTo(x - sz, y + sz);
      ctx.lineTo(x + sz, y + sz);
      ctx.lineTo(x, y - sz);
      ctx.closePath();
      ctx.fill();
    }
  }, [data]);

  // Handle resize
  useEffect(() => {
    if (!data) return;
    const handleResize = () => {
      setData(d => d ? { ...d } : d);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const dirColor = data?.direction === "LONG" ? "#00e5a0" : "#ff5470";
  const unfilledEntries = data?.overlays.entries.filter(e => e.price == null) ?? [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#0f1117",
          border: "1px solid #1e2130",
          borderRadius: 12,
          width: "100%",
          maxWidth: 900,
          maxHeight: "95vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid #1e2130",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {data && (
              <>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#e8eaf0", whiteSpace: "nowrap" }}>
                  {data.symbol}
                </span>
                <span
                  style={{
                    background: dirColor + "15",
                    color: dirColor,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {data.direction}
                </span>
                <span style={{ fontSize: 10, color: "#6b7080" }}>
                  {data.timeframe}
                </span>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <select
              value={timeframe ?? ""}
              onChange={(e) =>
                setTimeframe(
                  e.target.value ? (e.target.value as Timeframe) : undefined
                )
              }
              style={{
                background: "#1a1d2e",
                color: "#b0b5c0",
                border: "1px solid #2a2d3a",
                borderRadius: 6,
                padding: "4px 6px",
                fontSize: 11,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">Auto</option>
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#6b7080",
                fontSize: 20,
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "10px 10px 14px" }}>
          {loading && (
            <div style={{ padding: 48, textAlign: "center", color: "#b0b5c0" }}>
              Loading chart...
            </div>
          )}

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

          {!loading && !error && data && (
            <>
              <div ref={containerRef} style={{ width: "100%" }}>
                <canvas ref={canvasRef} style={{ display: "block", borderRadius: 8 }} />
              </div>

              {/* Legend */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 14px",
                  marginTop: 10,
                  fontSize: 10,
                  color: "#9ca3b0",
                }}
              >
                <LegendItem color="#5b8def" label="Entry" />
                <LegendItem color="#ff5470" label="Stop Loss" />
                <LegendItem color="#00e5a0" label="Take Profit" />
                <LegendItem color="#ff9f43" label="Current" dashed />
                {unfilledEntries.length > 0 && (
                  <span style={{ color: "#6b7080", fontStyle: "italic" }}>
                    {unfilledEntries.length} unfilled
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          display: "inline-block",
          width: 14,
          height: 2,
          background: color,
          borderTop: dashed ? `2px dashed ${color}` : `2px solid ${color}`,
        }}
      />
      {label}
    </span>
  );
}

function formatPrice(price: number, compact = false): string {
  if (compact) {
    if (price >= 10000) return (price / 1000).toFixed(1) + "k";
    if (price >= 1000) return price.toFixed(0);
    if (price >= 1) return price.toFixed(2);
    return price.toPrecision(3);
  }
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toPrecision(4);
}

function formatTimeLabel(d: Date, timeframe: string, compact = false): string {
  if (timeframe === "1d" || timeframe === "1w") {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (compact) {
    // Time only on mobile for intraday
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
