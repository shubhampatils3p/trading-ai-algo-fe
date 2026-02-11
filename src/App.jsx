import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import PnL from "./pages/PnL";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Config from "./pages/Config";


export default function App() {
  const [page, setPage] = useState("dashboard");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthenticated(!!token);
  }, []);

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <Navbar active={page} onChange={setPage} />

        {page === "dashboard" && <Dashboard />}
        {page === "trades" && <Trades />}
        {page === "pnl" && <PnL />}
        {page === "config" && <Config />}
      </div>
    </div>
  );
}
