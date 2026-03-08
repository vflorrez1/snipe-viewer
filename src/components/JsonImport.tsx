import { useRef, useState } from "react";
import type { ImportResult } from "../types/trade";

interface JsonImportProps {
  jsonText: string;
  setJsonText: (text: string) => void;
  importResult: ImportResult | null;
  onImport: (text: string) => void;
  onClear: () => void;
}

export default function JsonImport({
  jsonText,
  setJsonText,
  importResult,
  onImport,
  onClear,
}: JsonImportProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      onImport(text);
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <div
          style={{
            fontSize: 10,
            color: "#4a5060",
            letterSpacing: "0.12em",
            marginBottom: 12,
          }}
        >
          PASTE JSON OR DROP A FILE
        </div>
        <div
          className={`drop-zone${dragOver ? " over" : ""}`}
          style={{ marginBottom: 14 }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 6 }}>&#x2B06;</div>
          <div style={{ color: "#9ca3b0", fontSize: 12 }}>
            Drop a <span style={{ color: "#00e5a0" }}>.json</span> file here or
            click to browse
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <textarea
          rows={16}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder="Paste your JSON array here..."
          spellCheck={false}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            className="btn"
            onClick={() => onImport(jsonText)}
            style={{ background: "#00e5a0", color: "#080a0f", flex: 1 }}
          >
            Run Import
          </button>
          <button
            className="btn"
            onClick={onClear}
            style={{ background: "#1e2130", color: "#9ca3b0" }}
          >
            Clear
          </button>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 10,
            color: "#4a5060",
            letterSpacing: "0.12em",
            marginBottom: 12,
          }}
        >
          ACCEPTED SCHEMA
        </div>
        <div
          style={{
            background: "#0f1117",
            border: "1px solid #1e2130",
            borderRadius: 10,
            padding: 18,
            fontSize: 11,
            lineHeight: 2,
            marginBottom: 16,
          }}
        >
          {[
            { field: "date / timestamp", req: true, note: "ISO 8601 or YYYY-MM-DD" },
            { field: "pair / symbol", req: true, note: '"BTC/USDT"' },
            { field: "side / direction", req: true, note: "BUY | SELL | LONG | SHORT" },
            { field: "entry / entryPrice", req: true, note: "number" },
            { field: "exit / exitPrice", req: true, note: "number" },
            { field: "size / amount", req: true, note: "base asset quantity" },
            { field: "fee", req: false, note: "deducted from P&L" },
            { field: "feeCurrency", req: false, note: '"USDT"' },
            { field: "exchange / venue", req: false, note: "shown in table" },
            { field: "id / orderId", req: false, note: "deduplication key" },
          ].map((r) => (
            <div
              key={r.field}
              style={{
                display: "flex",
                gap: 10,
                borderBottom: "1px solid #12151e",
                padding: "2px 0",
              }}
            >
              <span style={{ color: r.req ? "#00e5a0" : "#3a3d50", minWidth: 160 }}>
                {r.field}
              </span>
              <span style={{ color: r.req ? "#9ca3b0" : "#2a2d3a" }}>
                {r.note}
              </span>
              {r.req && (
                <span style={{ marginLeft: "auto", fontSize: 9, color: "#00e5a050" }}>
                  REQUIRED
                </span>
              )}
            </div>
          ))}
        </div>

        {importResult && (
          <div
            style={{
              background: "#0f1117",
              border: `1px solid ${importResult.error ? "#ff5470" : "#1e2130"}`,
              borderRadius: 10,
              padding: 18,
            }}
          >
            {importResult.error ? (
              <div style={{ color: "#ff5470", fontSize: 12 }}>
                {importResult.error}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 28, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "#4a5060", letterSpacing: "0.1em" }}>
                      IMPORTED
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: "#00e5a0" }}>
                      {importResult.imported}
                    </div>
                  </div>
                  {importResult.incomplete! > 0 && (
                    <div>
                      <div style={{ fontSize: 9, color: "#4a5060", letterSpacing: "0.1em" }}>
                        OPEN POS.
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: "#ff9f43" }}>
                        {importResult.incomplete}
                      </div>
                    </div>
                  )}
                  {importResult.skipped! > 0 && (
                    <div>
                      <div style={{ fontSize: 9, color: "#4a5060", letterSpacing: "0.1em" }}>
                        SKIPPED
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: "#ff5470" }}>
                        {importResult.skipped}
                      </div>
                    </div>
                  )}
                </div>
                {importResult.incomplete! > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#ff9f43",
                      padding: "8px 10px",
                      background: "#ff9f4308",
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    {importResult.incomplete} trade
                    {importResult.incomplete! > 1 ? "s are" : " is"} missing an
                    exit price and will be excluded from P&L calculations. Add
                    exit prices to include them.
                  </div>
                )}
                {importResult.errors?.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      color: "#ff9f43",
                      marginTop: 8,
                      padding: "8px 10px",
                      background: "#ff9f4308",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ color: "#4a5060" }}>Row {e.index}: </span>
                    {e.errors.join(", ")}
                    <div
                      style={{
                        color: "#3a3d50",
                        fontSize: 10,
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.raw}...
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
