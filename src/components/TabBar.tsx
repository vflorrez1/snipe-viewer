interface TabBarProps {
  tab: string;
  setTab: (tab: string) => void;
  editId: number | string | null;
}

export default function TabBar({ tab, setTab, editId }: TabBarProps) {
  const tabs = [
    { key: "trades", label: "Trades" },
    { key: "import", label: "Import JSON" },
    { key: "add", label: editId ? "Edit" : "+ Add" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 20,
        background: "#0f1117",
        borderRadius: 8,
        padding: 4,
        width: "fit-content",
        border: "1px solid #1e2130",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          className="tab-btn"
          onClick={() => setTab(t.key)}
          style={{
            color: tab === t.key ? "#080a0f" : "#8a90a0",
            background: tab === t.key ? "#00e5a0" : "none",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
