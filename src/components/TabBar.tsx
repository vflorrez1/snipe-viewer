import { useState, useEffect } from "react";
import { PORTFOLIO_SUB_TABS } from "./PortfolioDashboard";
import type { PortfolioSubTab } from "./PortfolioDashboard";

interface TabBarProps {
  tab: string;
  setTab: (tab: string) => void;
  editId: number | string | null;
  portfolioSubTab: PortfolioSubTab;
  setPortfolioSubTab: (tab: PortfolioSubTab) => void;
  onSidebarChange?: (open: boolean) => void;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

const SIDEBAR_WIDTH = 220;

function NavItems({
  tabs,
  tab,
  setTab,
  portfolioSubTab,
  setPortfolioSubTab,
  onNavigate,
  showNestedSubTabs,
}: {
  tabs: { key: string; label: string }[];
  tab: string;
  setTab: (tab: string) => void;
  portfolioSubTab: PortfolioSubTab;
  setPortfolioSubTab: (tab: PortfolioSubTab) => void;
  onNavigate?: () => void;
  showNestedSubTabs?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {tabs.map((t) => {
        const isActive = tab === t.key;
        const hasSubTabs = t.key === "portfolio" && showNestedSubTabs !== false;

        return (
          <div key={t.key}>
            <button
              onClick={() => {
                setTab(t.key);
                if (!hasSubTabs) onNavigate?.();
              }}
              style={{
                width: "100%",
                background: isActive ? "#00e5a0" : "transparent",
                color: isActive ? "#080a0f" : "#b0b5c0",
                border: "none",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                fontFamily: "inherit",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                whiteSpace: "nowrap",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {t.label}
            </button>

            {/* Nested portfolio sub-tabs */}
            {hasSubTabs && isActive && (
              <div
                style={{
                  marginLeft: 12,
                  marginTop: 4,
                  borderLeft: "2px solid #134e4a",
                  paddingLeft: 0,
                }}
              >
                {PORTFOLIO_SUB_TABS.map((st) => {
                  const isSubActive = portfolioSubTab === st.key;
                  return (
                    <div
                      key={st.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 2,
                      }}
                    >
                      {/* Horizontal branch */}
                      <div
                        style={{
                          width: 10,
                          height: 2,
                          background: "#134e4a",
                          flexShrink: 0,
                        }}
                      />
                      <button
                        onClick={() => {
                          setTab("portfolio");
                          setPortfolioSubTab(st.key);
                          onNavigate?.();
                        }}
                        style={{
                          width: "100%",
                          background: isSubActive ? "#0d9488" : "transparent",
                          color: isSubActive ? "#e8eaf0" : "#5eead4",
                          border: "none",
                          borderRadius: 6,
                          padding: "7px 10px",
                          fontSize: 11,
                          fontFamily: "inherit",
                          fontWeight: isSubActive ? 600 : 400,
                          cursor: "pointer",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          letterSpacing: "0.04em",
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {st.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TabBar({
  tab,
  setTab,
  editId,
  portfolioSubTab,
  setPortfolioSubTab,
  onSidebarChange,
}: TabBarProps) {
  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) onSidebarChange?.(sidebarOpen);
    else onSidebarChange?.(false);
  }, [sidebarOpen, isMobile, onSidebarChange]);

  const tabs = [
    { key: "portfolio", label: "Portfolio" },
    { key: "trades", label: "Trades" },
    { key: "import", label: "Import JSON" },
    { key: "add", label: editId ? "Edit" : "+ Add" },
  ];

  // Desktop: sidebar
  if (!isMobile) {
    return (
      <>
        {/* Sidebar */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: SIDEBAR_WIDTH,
            height: "100vh",
            background: "#0b0d12",
            borderRight: "1px solid #1e2130",
            zIndex: 900,
            transform: sidebarOpen ? "translateX(0)" : `translateX(-${SIDEBAR_WIDTH}px)`,
            transition: "transform 0.25s ease",
            display: "flex",
            flexDirection: "column",
            padding: "20px 12px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#9ca3b0",
              letterSpacing: "0.12em",
              marginBottom: 16,
              padding: "0 6px",
            }}
          >
            NAVIGATION
          </div>

          <NavItems
            tabs={tabs}
            tab={tab}
            setTab={setTab}
            showNestedSubTabs={false}
            portfolioSubTab={portfolioSubTab}
            setPortfolioSubTab={setPortfolioSubTab}
          />
        </div>

        {/* Toggle button + current tab label */}
        <div
          style={{
            position: "fixed",
            top: 20,
            left: sidebarOpen ? SIDEBAR_WIDTH + 8 : 8,
            zIndex: 901,
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "left 0.25s ease",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "#0f1117",
              border: "1px solid #1e2130",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#b0b5c0",
              fontSize: 16,
              flexShrink: 0,
            }}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "\u2039" : "\u203A"}
          </button>
          <span
            style={{
              fontSize: 14,
              color: "#00e5a0",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              whiteSpace: "nowrap",
              opacity: sidebarOpen ? 0 : 1,
              transform: sidebarOpen ? "translateX(-8px)" : "translateX(0)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
              pointerEvents: sidebarOpen ? "none" : "auto",
            }}
          >
            {tabs.find((t) => t.key === tab)?.label}
          </span>
        </div>

      </>
    );
  }

  // Mobile: FAB
  const currentLabel = tabs.find((t) => t.key === tab)?.label;

  return (
    <>
      {/* Current tab title */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 997,
          padding: "16px 16px",
          background: "#080a0f",
          fontSize: 14,
          color: "#00e5a0",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          opacity: open ? 0 : 1,
          transform: open ? "translateX(-8px)" : "translateX(0)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: "none",
        }}
      >
        {currentLabel}
        {tab === "portfolio" && (
          <span style={{ color: "#5eead4", marginLeft: 8, fontSize: 12, fontWeight: 400 }}>
            / {PORTFOLIO_SUB_TABS.find((st) => st.key === portfolioSubTab)?.label}
          </span>
        )}
      </div>

      {/* Scrim overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 998,
          }}
        />
      )}

      {/* FAB + menu container */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}>
        {open && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 12,
              alignItems: "flex-end",
            }}
          >
            {tabs.map((t) => {
              const isActive = tab === t.key;
              const hasSubTabs = t.key === "portfolio";
              const showSubTabs = hasSubTabs && isActive;

              return (
                <div
                  key={t.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  {/* Sub-tabs fly out to the left with connector line */}
                  {showSubTabs && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        animation: "slideInLeft 0.2s ease-out",
                        borderRight: "2px solid #134e4a",
                        paddingRight: 12,
                        marginRight: 4,
                      }}
                    >
                      {PORTFOLIO_SUB_TABS.map((st, i) => {
                        const isSubActive = portfolioSubTab === st.key;
                        const isLast = i === PORTFOLIO_SUB_TABS.length - 1;
                        return (
                          <div
                            key={st.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              paddingBottom: isLast ? 0 : 5,
                            }}
                          >
                            <button
                              onClick={() => {
                                setTab("portfolio");
                                setPortfolioSubTab(st.key);
                                setOpen(false);
                              }}
                              style={{
                                background: isSubActive ? "#0d9488" : "#0c2e2a",
                                color: isSubActive ? "#e8eaf0" : "#5eead4",
                                border: `1px solid ${isSubActive ? "#0d9488" : "#134e4a"}`,
                                borderRadius: 8,
                                padding: "7px 14px",
                                fontSize: 11,
                                fontFamily: "inherit",
                                fontWeight: isSubActive ? 600 : 400,
                                cursor: "pointer",
                                textAlign: "right",
                                whiteSpace: "nowrap",
                                letterSpacing: "0.04em",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                              }}
                            >
                              {st.label}
                            </button>
                            {/* Horizontal branch line */}
                            <div
                              style={{
                                width: 12,
                                height: 2,
                                background: "#134e4a",
                                flexShrink: 0,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Main tab button */}
                  <button
                    onClick={() => {
                      setTab(t.key);
                      if (!hasSubTabs) setOpen(false);
                    }}
                    style={{
                      background: isActive ? "#00e5a0" : "#0f1117",
                      color: isActive ? "#080a0f" : "#e8eaf0",
                      border: "1px solid #1e2130",
                      borderRadius: 10,
                      padding: "10px 18px",
                      fontSize: 12,
                      fontFamily: "inherit",
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      letterSpacing: "0.04em",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                      flexShrink: 0,
                    }}
                  >
                    {t.label}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: open ? "#1e2130" : "#00e5a0",
            color: open ? "#e8eaf0" : "#080a0f",
            border: "none",
            fontSize: open ? 22 : 20,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 24px rgba(0,229,160,0.25)",
            marginLeft: "auto",
            transition: "background 0.2s, color 0.2s",
            lineHeight: 1,
            padding: 0,
          }}
        >
          {open ? "\u2715" : "\u2630"}
        </button>
      </div>
    </>
  );
}
