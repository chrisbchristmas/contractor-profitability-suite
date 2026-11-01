import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Resources() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.SeoArticle.filter({ status: "published" }, "-publish_date", 50)
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter(a =>
    !search ||
    (a.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.primary_keyword || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Link to={createPageUrl("AAppLanding")} className="text-blue-600 text-sm mb-4 inline-block hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Contractor Profit Guides</h1>
          <p className="text-gray-500 text-lg mb-6">
            Actionable guides to help contractors price jobs, track costs, and protect margins.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3 w-1/3" />
                <div className="h-6 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">{search ? "No articles match your search." : "No published articles yet."}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>

      {/* Compare Tools */}
      <section className="bg-white border-t">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare Contractor Profitability Suite</h2>
          <p className="text-gray-500 mb-6 max-w-2xl">
            How CPS stacks up against popular field-service and accounting tools for per-job profitability and change order tracking.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/compare/jobber" className="group rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">vs Jobber</h3>
              <p className="text-sm text-gray-500 mt-1">Per-job profitability vs field-service scheduling.</p>
              <span className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-3">Read comparison <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link to="/compare/housecall-pro" className="group rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">vs Housecall Pro</h3>
              <p className="text-sm text-gray-500 mt-1">Change order profit tracking vs dispatch & booking.</p>
              <span className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-3">Read comparison <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link to="/compare/quickbooks" className="group rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">vs QuickBooks</h3>
              <p className="text-sm text-gray-500 mt-1">Job profitability depth vs general accounting.</p>
              <span className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-3">Read comparison <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ArticleCard({ article }) {
  const wordCount = article.word_count || 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <Link
      to={`${createPageUrl("BlogPost")}?slug=${article.slug}`}
      className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all hover:border-blue-300 flex flex-col"
    >
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {article.publish_date ? new Date(article.publish_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
        </span>
        {wordCount > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {readTime} min read
          </span>
        )}
      </div>
      <h2 className="text-gray-900 font-semibold text-base leading-snug mb-2 group-hover:text-blue-700 transition-colors flex-1">
        {article.title || article.primary_keyword}
      </h2>
      {article.meta_description && (
        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{article.meta_description}</p>
      )}
      <span className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-auto">
        Read article <ArrowRight className="w-3 h-3" />
      </span>
    </Link>
  );
}