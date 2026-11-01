import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Eye, MousePointerClick, UserPlus, Zap, AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MarketingInsights() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [sort, setSort] = useState({ field: "views", dir: -1 });

  const load = () => {
    setLoading(true);
    base44.entities.SeoArticle.filter({ status: "published" }, "-views", 100)
      .then(setArticles)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const withRate = articles.map(a => ({
    ...a,
    conversion_rate: a.views > 0 ? ((a.signups_generated || 0) / a.views) * 100 : 0,
    underperforming: a.views >= 10 && ((a.signups_generated || 0) / a.views) * 100 < 1
  }));

  const totalViews = withRate.reduce((s, a) => s + (a.views || 0), 0);
  const totalClicks = withRate.reduce((s, a) => s + (a.clicks_to_calculator || 0), 0);
  const totalSignups = withRate.reduce((s, a) => s + (a.signups_generated || 0), 0);
  const avgConversion = withRate.length ? (withRate.reduce((s, a) => s + a.conversion_rate, 0) / withRate.length) : 0;

  const top5 = [...withRate].sort((a, b) => b.conversion_rate - a.conversion_rate).slice(0, 5);
  const bottom5 = [...withRate].filter(a => a.views >= 10).sort((a, b) => a.conversion_rate - b.conversion_rate).slice(0, 5);

  const sorted = [...withRate].sort((a, b) => {
    const av = a[sort.field] ?? 0;
    const bv = b[sort.field] ?? 0;
    return sort.dir * (bv > av ? 1 : bv < av ? -1 : 0);
  });

  const toggleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir * -1 } : { field, dir: -1 });
  };

  const runPublish = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("autoPublishArticle", {});
      load();
    } finally {
      setRunning(false);
    }
  };

  const runRewrite = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("rewriteUnderperforming", {});
      load();
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Insights</h1>
            <p className="text-gray-500 text-sm mt-1">SEO article performance and conversion tracking</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={runRewrite} disabled={running}>
              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" /> Rewrite Underperforming
            </Button>
            <Button size="sm" onClick={runPublish} disabled={running} className="bg-blue-700 hover:bg-blue-800">
              <Zap className="w-4 h-4 mr-1" /> Publish Next Article
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={Eye} label="Total Views" value={totalViews.toLocaleString()} color="blue" />
          <KpiCard icon={MousePointerClick} label="CTA Clicks" value={totalClicks.toLocaleString()} color="indigo" />
          <KpiCard icon={UserPlus} label="Signups" value={totalSignups.toLocaleString()} color="green" />
          <KpiCard icon={TrendingUp} label="Avg Conversion" value={`${avgConversion.toFixed(2)}%`} color="purple" />
        </div>

        {/* Top / Bottom */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" /> Top 5 Articles
            </h2>
            {top5.length === 0 ? <p className="text-gray-400 text-sm">No data yet.</p> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={top5} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" tickFormatter={v => `${v.toFixed(1)}%`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="title" tick={{ fontSize: 10 }} width={120} tickFormatter={v => v ? v.substring(0, 22) + (v.length > 22 ? "…" : "") : ""} />
                  <Tooltip formatter={(v) => [`${v.toFixed(2)}%`, "Conversion"]} />
                  <Bar dataKey="conversion_rate" radius={[0, 4, 4, 0]}>
                    {top5.map((_, i) => <Cell key={i} fill="#22c55e" opacity={1 - i * 0.15} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" /> Underperforming (needs rewrite)
            </h2>
            {bottom5.length === 0 ? (
              <p className="text-gray-400 text-sm">No articles with enough data yet (need ≥10 views).</p>
            ) : (
              <div className="space-y-3">
                {bottom5.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-700 truncate flex-1">{a.title || a.primary_keyword}</span>
                    <span className="text-red-500 font-medium whitespace-nowrap">{a.conversion_rate.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">All Published Articles ({withRate.length})</h2>
            <Link to={createPageUrl("Blog")} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              View Blog <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : withRate.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No published articles yet. Click "Publish Next Article" to generate one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Article</th>
                    <SortTh field="views" label="Views" sort={sort} onSort={toggleSort} />
                    <SortTh field="clicks_to_calculator" label="Clicks" sort={sort} onSort={toggleSort} />
                    <SortTh field="signups_generated" label="Signups" sort={sort} onSort={toggleSort} />
                    <SortTh field="conversion_rate" label="Conv. Rate" sort={sort} onSort={toggleSort} />
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-gray-800 truncate">{a.title || a.primary_keyword}</p>
                        <p className="text-gray-400 text-xs truncate">{a.primary_keyword}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{(a.views || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{(a.clicks_to_calculator || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{(a.signups_generated || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">{a.conversion_rate.toFixed(2)}%</td>
                      <td className="px-4 py-3">
                        {a.underperforming ? (
                          <Badge className="bg-red-50 text-red-600 border-red-200 gap-1">
                            <AlertTriangle className="w-3 h-3" /> Review
                          </Badge>
                        ) : (
                          <Badge className="bg-green-50 text-green-700 border-green-200 gap-1">
                            <CheckCircle className="w-3 h-3" /> Good
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {a.slug && (
                          <Link
                            to={`${createPageUrl("BlogPost")}?slug=${a.slug}`}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700"
  };
  return (
    <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function SortTh({ field, label, sort, onSort }) {
  const active = sort.field === field;
  return (
    <th
      className="px-4 py-3 text-center font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
      onClick={() => onSort(field)}
    >
      {label} {active ? (sort.dir === -1 ? "↓" : "↑") : ""}
    </th>
  );
}