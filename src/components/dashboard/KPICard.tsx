interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: string; positive: boolean };
  color?: "gold" | "green" | "blue" | "red" | "purple" | "orange";
}

const colorMap = {
  gold: "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const iconBgMap = {
  gold: "bg-brand-gold/20 text-brand-gold",
  green: "bg-emerald-500/20 text-emerald-400",
  blue: "bg-blue-500/20 text-blue-400",
  red: "bg-red-500/20 text-red-400",
  purple: "bg-purple-500/20 text-purple-400",
  orange: "bg-orange-500/20 text-orange-400",
};

export default function KPICard({
  title,
  value,
  icon,
  trend,
  color = "gold",
}: KPICardProps) {
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 hover:border-slate-500 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgMap[color]}`}
        >
          <i className={`${icon} text-lg`}></i>
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trend.positive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <i
              className={`fas fa-arrow-${trend.positive ? "up" : "down"} mr-1`}
            ></i>
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );
}
