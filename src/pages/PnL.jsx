import { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";

export default function PnL() {
  const [pnl, setPnl] = useState(null);

  const fetchPnl = async () => {
    const res = await api.get("/control/pnl");
    setPnl(res.data);
  };

  useEffect(() => {
    fetchPnl();
    const id = setInterval(fetchPnl, 5000);
    return () => clearInterval(id);
  }, []);

  if (!pnl) {
    return <p className="text-gray-500">Loading PnL...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        💰 PnL & Performance
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Net PnL" value={`₹ ${pnl.net_pnl ?? 0}`} />
        <StatCard label="Total Trades" value={pnl.total_trades ?? 0} />
        <StatCard label="Wins" value={pnl.wins ?? 0} />
        <StatCard label="Losses" value={pnl.losses ?? 0} />
      </div>
    </div>
  );
}
