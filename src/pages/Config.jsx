import { useEffect, useState } from "react";
import api from "../api/client";

/**
 * Configuration Page - Dynamic algo settings management
 *
 * Allows admin to update:
 * - Trading parameters (quantity, SL%, target%)
 * - Risk limits (daily loss, max trades)
 * - Market timing
 * - Instrument priority
 * - DRY_RUN toggle
 */

export default function Config() {
  const [config, setConfig] = useState(null);
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState(null);

  const loadStatus = async () => {
    try {
      const res = await api.get("/control/status");
      setStatus(res.data);
    } catch (err) {
      console.error("Failed to load algo status", err);
    }
  };

  // Load current config and field definitions
  useEffect(() => {
    loadConfig();
    loadFields();
    loadStatus();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.get("/config");
      setConfig(res.data);
      setErrors([]);
    } catch (err) {
      setMessage("❌ Failed to load config");
      console.error(err);
    }
  };

  const loadFields = async () => {
    try {
      const res = await api.get("/config/fields");
      setFields(res.data.fields || {});
    } catch (err) {
      console.error("Failed to load field definitions", err);
    }
  };

  const validateConfig = async () => {
    try {
      const res = await api.get("/config/validate");
      setErrors(res.data.errors || []);
      return res.data.valid;
    } catch (err) {
      return false;
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Validate first
      const isValid = await validateConfig();
      if (!isValid) {
        setMessage("❌ Configuration has errors. Please fix and try again.");
        setSaving(false);
        return;
      }

      // Save
      const res = await api.post("/config", config);
      setConfig(res.data.config);
      setMessage("✅ Config saved successfully");
      setErrors([]);
    } catch (err) {
      setMessage(
        `❌ Failed to save config: ${err.response?.data?.detail || err.message}`,
      );
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm("Reset all settings to defaults?")) return;

    try {
      await api.post("/config/reset");
      await loadConfig();
      setMessage("✅ Config reset to defaults");
    } catch (err) {
      setMessage("❌ Failed to reset config");
    }
  };

  const toggleDryRun = async () => {
    try {
      const res = await api.post("/config/toggle-dry-run");
      setConfig({ ...config, dry_run: res.data.dry_run });
      setMessage(`✅ Switched to ${res.data.mode} mode`);
    } catch (err) {
      setMessage("❌ Failed to toggle DRY_RUN");
    }
  };

  const resetEmergency = async () => {
    const confirmed = window.confirm(
      "🚨 RESET EMERGENCY STOP\n\n" +
        "This will move the algo to STOPPED state.\n" +
        "Trading will NOT resume automatically.\n\n" +
        "Proceed only after checking broker positions.",
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      await api.post("/control/reset-emergency");
      setMessage("🟡 Emergency reset. Algo is now STOPPED.");
      await loadStatus();
    } catch (err) {
      setMessage(
        err.response?.data?.detail || "❌ Failed to reset emergency stop",
      );
    } finally {
      setSaving(false);
    }
  };

  const isEmergency = status?.algo_state === "EMERGENCY_STOP";

  if (!config) {
    return <p className="text-gray-500">Loading config...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        ⚙️ Configuration
      </h1>

      {status?.algo_state === "EMERGENCY_STOP" && (
        <div className="mb-6 rounded-xl border-2 border-red-500 bg-red-50 p-6">
          <h2 className="text-xl font-bold text-red-700">
            🚨 Emergency Mode Active
          </h2>

          <p className="mt-2 text-sm text-red-600">
            The algo is in <b>EMERGENCY_STOP</b>. All automation is frozen.
            Verify broker positions before resetting.
          </p>

          <button
            onClick={resetEmergency}
            disabled={saving}
            className="mt-4 rounded-lg bg-red-700 px-6 py-3 font-bold text-white
                 transition hover:bg-red-800
                 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🔄 Reset Emergency Stop
          </button>
        </div>
      )}

      {message && (
        <div
          className={`mb-4 p-3 rounded border ${message.includes("✅") ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"}`}
        >
          {message}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-4 rounded bg-red-100 border border-red-400 p-3">
          <p className="font-bold text-red-800">Validation Errors:</p>
          <ul className="mt-2 list-inside list-disc">
            {errors.map((err, i) => (
              <li key={i} className="text-red-700">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MODE TOGGLE */}
      <div className="mb-8 rounded bg-blue-50 border-2 border-blue-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-blue-900">
              🚀 Operating Mode
            </h2>
            <p className="text-sm text-blue-700 mt-2">
              {config.dry_run
                ? "🟢 DRY_RUN: Orders are simulated, no real money at risk"
                : "🔴 LIVE: Real orders via SmartAPI, real money trading"}
            </p>
          </div>
          <button
            onClick={toggleDryRun}
            disabled={saving}
            className={`px-6 py-3 font-bold rounded text-white ${
              config.dry_run
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {config.dry_run ? "Switch to LIVE" : "Switch to DRY_RUN"}
          </button>
        </div>
      </div>

      {/* TRADE EXECUTION */}
      <div className="mb-8 rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          📊 Trade Execution
        </h2>
        <div className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity (contracts per order)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="mt-1 w-32 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={config.quantity || 1}
              onChange={(e) =>
                setConfig({ ...config, quantity: parseInt(e.target.value) })
              }
              disabled={isEmergency}
            />
            <p className="mt-1 text-xs text-gray-500">
              {fields.quantity?.description}
            </p>
          </div>

          {/* Stop Loss */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stop Loss % (0.3 = 30%)
            </label>
            <input
              type="number"
              min="0.01"
              max="1"
              step="0.05"
              className="mt-1 w-32 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={config.stop_loss_pct || 0.3}
              onChange={(e) =>
                setConfig({
                  ...config,
                  stop_loss_pct: parseFloat(e.target.value),
                })
              }
              disabled={isEmergency}
            />
            <p className="mt-1 text-xs text-gray-500">
              {fields.stop_loss_pct?.description}
            </p>
          </div>

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target % (0.6 = 60%)
            </label>
            <input
              type="number"
              min="0.01"
              max="2"
              step="0.05"
              className="mt-1 w-32 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={config.target_pct || 0.6}
              onChange={(e) =>
                setConfig({ ...config, target_pct: parseFloat(e.target.value) })
              }
              disabled={isEmergency}
            />
            <p className="mt-1 text-xs text-gray-500">
              {fields.target_pct?.description}
            </p>
          </div>
        </div>
      </div>

      {/* RISK MANAGEMENT */}
      <div className="mb-8 rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          🛡️ Risk Management
        </h2>
        <div className="space-y-4">
          {/* Max Daily Loss */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Daily Loss (₹)
            </label>
            <input
              type="number"
              min="100"
              step="100"
              className="mt-1 w-40 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={config.max_daily_loss || 1000}
              onChange={(e) =>
                setConfig({
                  ...config,
                  max_daily_loss: parseFloat(e.target.value),
                })
              }
              disabled={isEmergency}
            />
            <p className="mt-1 text-xs text-gray-500">
              Trading will lock if daily loss exceeds this amount
            </p>
          </div>
            
          {/* Risk Per Trade */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Risk Per Trade % (1 = 1%)
            </label>
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              className="mt-1 w-32 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={config.risk_per_trade_pct || 1}
              onChange={(e) =>
                setConfig({
                  ...config,
                  risk_per_trade_pct: parseFloat(e.target.value),
                })
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Percentage of capital to risk per trade
            </p>
          </div>

          {/* Max Trades */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Trades Per Day
            </label>
            <input
              type="number"
              min="1"
              max="20"
              className="mt-1 w-32 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={config.max_trades_per_day || 5}
              onChange={(e) =>
                setConfig({
                  ...config,
                  max_trades_per_day: parseInt(e.target.value),
                })
              }
              disabled={isEmergency}
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum trades allowed in a single trading day
            </p>
          </div>

          {/* Cooldown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cooldown After Exit (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              className="mt-1 w-32 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={config.cooldown_minutes || 5}
              onChange={(e) =>
                setConfig({
                  ...config,
                  cooldown_minutes: parseInt(e.target.value),
                })
              }
              disabled={isEmergency}
            />
            <p className="mt-1 text-xs text-gray-500">
              Wait time before next trade after exit
            </p>
          </div>

          {/* Force Exit Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Force Exit Time (HH:MM, IST)
            </label>
            <input
              type="text"
              pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              placeholder="15:15"
              className="mt-1 w-32 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={config.force_exit_time || "15:15"}
              onChange={(e) =>
                setConfig({ ...config, force_exit_time: e.target.value })
              }
              disabled={isEmergency}
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-close all trades at this time
            </p>
          </div>
        </div>
      </div>

      {/* INSTRUMENTS */}
      <div className="mb-8 rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          📈 Instrument Priority
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          Algo scans instruments in this order. Uses first one with available
          candles.
        </p>
        <div className="space-y-2">
          {["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"].map(
            (instrument) => (
              <label key={instrument} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={(config.instrument_priority || []).includes(
                    instrument,
                  )}
                  onChange={(e) => {
                    const list = config.instrument_priority || [];
                    if (e.target.checked && !list.includes(instrument)) {
                      setConfig({
                        ...config,
                        instrument_priority: [...list, instrument],
                      });
                    } else if (!e.target.checked) {
                      setConfig({
                        ...config,
                        instrument_priority: list.filter(
                          (i) => i !== instrument,
                        ),
                      });
                    }
                  }}
                  className="rounded"
                  disabled={isEmergency}
                />
                <span className="text-gray-700">{instrument}</span>
              </label>
            ),
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3">
        <button
          onClick={saveConfig}
          disabled={saving || isEmergency}
          className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "✅ Save Configuration"}
        </button>

        <button
          onClick={resetToDefaults}
          disabled={saving || isEmergency}
          className="rounded-lg bg-gray-600 px-6 py-3 font-bold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          ♻️ Reset Defaults
        </button>
      </div>

      {/* INFO BOX */}
      <div className="mt-8 rounded bg-blue-50 border border-blue-300 p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> All settings are dynamic and applied
          immediately. Changes don't require restart.
        </p>
      </div>
    </div>
  );
}
