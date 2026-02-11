import { useEffect, useState } from "react";
import api from "../api/client";

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      const res = await api.get("/control/trades");
      setTrades(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const id = setInterval(fetchTrades, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading trades...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        📜 Trades
      </h1>

      {trades.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-gray-500">No trades yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Symbol</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Exit</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {trades.map((t, i) => {
                const isOpen = !t.exit_price;
                const pnl =
                  t.exit_price && t.entry_price
                    ? (t.exit_price - t.entry_price) * t.quantity
                    : 0;

                return (
                  <tr
                    key={i}
                    className="border-t last:border-b"
                  >
                    <td className="px-4 py-3">{t.symbol}</td>
                    <td className="px-4 py-3">{t.option_type}</td>
                    <td className="px-4 py-3 text-center">
                      {t.entry_price}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.exit_price ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.quantity}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-medium ${
                        isOpen
                          ? "text-orange-600"
                          : pnl >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {isOpen
                        ? "OPEN"
                        : pnl >= 0
                        ? `PROFIT (+${pnl})`
                        : `LOSS (${pnl})`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
