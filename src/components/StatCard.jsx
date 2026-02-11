const COLOR_MAP = {
  green: "text-green-900",
  red: "text-red-900",
  yellow: "text-yellow-900",
  blue: "text-blue-900",
  orange: "text-orange-900",
  gray: "text-gray-700",
};

export default function StatCard({ label, value, color = "gray" }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${COLOR_MAP[color] || COLOR_MAP.gray}`}>
        {value}
      </p>
    </div>
  );
}