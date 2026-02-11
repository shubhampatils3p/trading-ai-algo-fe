export default function Navbar({ active, onChange }) {
  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "trades", label: "Trades" },
    { key: "pnl", label: "PnL" },
    { key: "config", label: "Config" },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="mb-8 flex items-center justify-between border-b border-gray-200">
      <nav className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`pb-3 text-sm font-medium transition ${
              active === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <button
        onClick={logout}
        className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
      >
        Logout
      </button>
    </div>
  );
}
