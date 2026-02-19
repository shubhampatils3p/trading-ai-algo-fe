import { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/control/status");
      setStatus(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch status");
      console.error("Status fetch error:", err);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh status every 5 seconds
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const startAlgo = async () => {
    setLoading(true);
    try {
      await api.post("/control/resume");
      await fetchStatus();
    } catch (err) {
      setError("Failed to start algo");
    }
    setLoading(false);
  };

  const pauseAlgo = async () => {
    setLoading(true);
    try {
      await api.post("/control/pause");
      await fetchStatus();
    } catch (err) {
      setError("Failed to pause algo");
    }
    setLoading(false);
  };

  const emergencyStop = async () => {
    if (
      !window.confirm(
        "⚠️ Emergency stop will halt all trading immediately. Continue?",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await api.post("/control/emergency-stop");
      await fetchStatus();
      setError("⚠️ Algo in EMERGENCY STOP mode");
    } catch (err) {
      setError("Failed to execute emergency stop");
    }
    setLoading(false);
  };

  const closeActiveTrade = async () => {
    if (!status?.active_trade) return;

    if (!window.confirm("Close active trade immediately?")) {
      return;
    }

    setLoading(true);
    try {
      await api.post(`/control/trades/close`);
      await fetchStatus();
    } catch (err) {
      setError("Failed to close trade");
    }
    setLoading(false);
  };

  if (!status) {
    return <p className="text-gray-500">Loading dashboard...</p>;
  }

  const getAlgoStatusUI = (status) => {
    if (status.algo_state === "EMERGENCY_STOP") {
      return {
        value: "🚨 EMERGENCY STOP",
        color: "red",
      };
    }

    if (status.algo_state === "STOPPED") {
      return {
        value: "⛔ STOPPED",
        color: "gray",
      };
    }

    if (status.paused) {
      return {
        value: "⏸ PAUSED",
        color: "yellow",
      };
    }

    return {
      value: "▶ RUNNING",
      color: "green",
    };
  };

  const isEmergency = status.algo_state === "EMERGENCY_STOP";
  const isRunning = status.algo_state === "RUNNING";
  const isPaused = status.algo_state === "PAUSED";
  const isStopped = status.algo_state === "STOPPED";

  const disableAll = loading || isEmergency;

  const activeTrade = status.active_trade;
  const riskStatus = status.risk_guard || {};
  const algoStatusUI = getAlgoStatusUI(status);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        📊 SmartAlgo Dashboard
      </h1>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700 border border-red-400">
          {error}
        </div>
      )}

      {/* Main Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <StatCard
          label="Algo Status"
          value={algoStatusUI.value}
          color={algoStatusUI.color}
        />
        <StatCard
          label="Mode"
          value={status.mode}
          color={status.dry_run ? "blue" : "red"}
        />
        <StatCard
          label="Active Trade"
          value={activeTrade ? "YES" : "NO"}
          color={activeTrade ? "orange" : "gray"}
        />
        <StatCard
          label="Daily P&L"
          value={`₹${riskStatus.daily_pnl || 0}`}
          color={riskStatus.daily_pnl >= 0 ? "green" : "red"}
        />
      </div>

      {/* Risk Guard Status */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          🛡️ Risk Management
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded bg-gray-50 p-3">
            <p className="text-sm text-gray-600">Trades Today</p>
            <p className="text-2xl font-bold text-gray-800">
              {riskStatus.trade_count || 0} /{" "}
              {riskStatus.max_trades_per_day || 5}
            </p>
          </div>
          <div className="rounded bg-gray-50 p-3">
            <p className="text-sm text-gray-600">Daily Loss Limit</p>
            <p
              className={`text-2xl font-bold ${(riskStatus.daily_pnl || 0) <= -(riskStatus.daily_loss_limit || 1000) ? "text-red-600" : "text-gray-800"}`}
            >
              ₹{riskStatus.daily_loss_limit || 1000}
            </p>
          </div>
          <div className="rounded bg-gray-50 p-3">
            <p className="text-sm text-gray-600">Status</p>
            <p
              className={`text-2xl font-bold ${riskStatus.locked ? "text-red-600" : "text-green-600"}`}
            >
              {riskStatus.locked ? "🔒 LOCKED" : "🔓 ACTIVE"}
            </p>
          </div>
          <div className="rounded bg-gray-50 p-3">
            <p className="text-sm text-gray-600">Date</p>
            <p className="text-lg font-bold text-gray-800">
              {new Date(riskStatus.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Active Trade Details */}
      {activeTrade && (
        <div className="mb-8 rounded-lg bg-orange-50 border-2 border-orange-300 p-6">
          <h2 className="mb-4 text-xl font-bold text-orange-800">
            📈 Active Trade
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <p className="text-sm text-orange-700">Type</p>
              <p className="text-lg font-bold text-gray-800">
                {activeTrade.option_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-orange-700">Entry Price</p>
              <p className="text-lg font-bold text-gray-800">
                ₹{activeTrade.entry_price?.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-orange-700">Quantity</p>
              <p className="text-lg font-bold text-gray-800">
                {activeTrade.quantity}
              </p>
            </div>
            <div>
              <p className="text-sm text-orange-700">Entry Time</p>
              <p className="text-sm font-bold text-gray-800">
                {new Date(activeTrade.entry_time).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-orange-700">Unrealized P&L</p>
              <p
                className={`text-lg font-bold ${status.open_trade_pnl?.pnl >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {status.open_trade_pnl
                  ? `₹${status.open_trade_pnl.pnl?.toFixed(2)}`
                  : "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={closeActiveTrade}
            disabled={loading}
            className="mt-4 rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            🚪 Close Trade Manually
          </button>
        </div>
      )}

      {/* Control Buttons */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-800">⚙️ Controls</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={startAlgo}
            disabled={disableAll || isRunning}
            className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition
                      hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ▶ {isPaused ? "Resume Algo" : "Start Algo"}
          </button>

          <button
            onClick={pauseAlgo}
            disabled={disableAll || !isRunning}
            className="rounded-lg bg-yellow-600 px-6 py-3 font-semibold text-white transition
             hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ⏸ Pause Algo
          </button>

          <button
              onClick={emergencyStop}
              disabled={loading}
              className={`rounded-lg px-6 py-3 font-semibold text-white transition
                ${isEmergency ? "bg-red-800 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"} `}
            >
              🚨 Emergency Stop
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Emergency Stop will immediately halt all trading and prevent
          auto-restart. Use only in emergencies.
        </p>
      </div>
    </div>
  );
}
