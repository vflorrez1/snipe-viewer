import type { TradeForm as TradeFormType, ValidationErrors } from "../types/trade";
import { fmt } from "../utils/trade";
import { PAIRS } from "../data/constants";

interface TradeFormProps {
  form: TradeFormType;
  setForm: (form: TradeFormType) => void;
  formErrors: ValidationErrors;
  setFormErrors: (errors: ValidationErrors) => void;
  editId: number | string | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function TradeForm({
  form,
  setForm,
  formErrors,
  setFormErrors,
  editId,
  onSubmit,
  onCancel,
}: TradeFormProps) {
  const fields = [
    { label: "DATE", key: "date", type: "date", required: true },
    { label: "PAIR", key: "pair", type: "select", options: PAIRS, required: true },
    { label: "SIDE", key: "side", type: "select", options: ["BUY", "SELL"], required: true },
    { label: "SIZE", key: "size", type: "number", placeholder: "e.g. 0.5", required: true },
    { label: "ENTRY PRICE", key: "entry", type: "number", placeholder: "e.g. 43000", required: true },
    { label: "EXIT PRICE", key: "exit", type: "number", placeholder: "e.g. 48000 (optional — open position)", required: false },
  ];

  const showPreview = form.entry && form.exit && form.size;

  return (
    <div
      style={{
        background: "#0f1117",
        border: "1px solid #1e2130",
        borderRadius: 12,
        padding: 28,
        maxWidth: 520,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#4a5060",
          letterSpacing: "0.12em",
          marginBottom: 24,
        }}
      >
        {editId ? "EDIT TRADE" : "NEW TRADE"}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {fields.map((f) => (
          <div key={f.key}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: formErrors[f.key] ? "#ff5470" : "#4a5060",
                  letterSpacing: "0.12em",
                }}
              >
                {f.label}
                {f.required && (
                  <span style={{ color: "#ff5470", marginLeft: 2 }}>*</span>
                )}
              </div>
              {!f.required && (
                <div style={{ fontSize: 9, color: "#3a3d50" }}>optional</div>
              )}
            </div>
            {f.type === "select" ? (
              <select
                value={form[f.key as keyof TradeFormType]}
                onChange={(e) => {
                  setForm({ ...form, [f.key]: e.target.value });
                  setFormErrors({ ...formErrors, [f.key]: undefined });
                }}
                style={{
                  borderColor: formErrors[f.key] ? "#ff5470" : undefined,
                }}
              >
                {f.options!.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type={f.type}
                value={form[f.key as keyof TradeFormType]}
                placeholder={f.placeholder}
                style={{
                  borderColor: formErrors[f.key] ? "#ff5470" : undefined,
                }}
                onChange={(e) => {
                  setForm({ ...form, [f.key]: e.target.value });
                  setFormErrors({ ...formErrors, [f.key]: undefined });
                }}
              />
            )}
            {formErrors[f.key] && (
              <div style={{ fontSize: 10, color: "#ff5470", marginTop: 4 }}>
                {formErrors[f.key]}
              </div>
            )}
          </div>
        ))}
      </div>

      {showPreview &&
        (() => {
          const entry = +form.entry;
          const exit = +form.exit;
          const size = +form.size;
          const p =
            form.side === "BUY"
              ? (exit - entry) * size
              : (entry - exit) * size;
          const r =
            form.side === "BUY"
              ? ((exit - entry) / entry) * 100
              : ((entry - exit) / entry) * 100;
          return (
            <div
              style={{
                marginTop: 20,
                padding: "12px 16px",
                background: "#080a0f",
                borderRadius: 8,
                border: "1px solid #1e2130",
                display: "flex",
                gap: 24,
              }}
            >
              <div>
                <div style={{ fontSize: 9, color: "#4a5060", letterSpacing: "0.1em" }}>
                  ESTIMATED P&L
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: p >= 0 ? "#00e5a0" : "#ff5470",
                  }}
                >
                  {p >= 0 ? "+" : ""}${fmt(p)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#4a5060", letterSpacing: "0.1em" }}>
                  RETURN
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: r >= 0 ? "#00e5a0" : "#ff5470",
                  }}
                >
                  {r >= 0 ? "+" : ""}
                  {fmt(r)}%
                </div>
              </div>
            </div>
          );
        })()}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          className="btn"
          onClick={onSubmit}
          style={{ background: "#00e5a0", color: "#080a0f", flex: 1 }}
        >
          {editId ? "Save Changes" : "Add Trade"}
        </button>
        {editId && (
          <button
            className="btn"
            onClick={onCancel}
            style={{ background: "#1e2130", color: "#9ca3b0" }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
