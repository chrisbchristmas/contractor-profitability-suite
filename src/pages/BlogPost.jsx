import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { safeJsonLd } from "@/utils/safeJsonLd";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";

export default function BlogPost() {
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const tracked = useRef(false);

  const slug = new URLSearchParams(window.location.search).get("slug");

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    base44.entities.SeoArticle.filter({ slug, status: "published" })
      .then(results => {
        if (!results.length) { setNotFound(true); return; }
        const a = results[0];
        setArticle(a);
        document.title = `${a.title} | Contractor Profitability Suite`;

        // Track view (once per mount)
        if (!tracked.current) {
          tracked.current = true;
          base44.functions.invoke("trackArticleEvent", { slug, event_type: "view" }).catch(() => {});
        }

        // Load related articles
        return base44.entities.SeoArticle.filter({ status: "published" }, "-publish_date", 10)
          .then(all => setRelatedArticles(all.filter(x => x.id !== a.id).slice(0, 3)));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCTAClick = () => {
    base44.functions.invoke("trackArticleEvent", { slug, event_type: "cta_click" }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Article Not Found</h1>
        <p className="text-gray-500 mb-6">This article may have been moved or doesn't exist.</p>
        <Link to={createPageUrl("Resources")} className="text-blue-600 hover:underline">← Back to Resources</Link>
      </div>
    );
  }

  const wordCount = article.word_count || 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  // Inject CTA click tracking into rendered HTML
  const injectCtaTracking = (html) => {
    return html.replace(
      /href="\/billing"/g,
      `href="/billing" onclick="window.__trackCTA && window.__trackCTA()"`
    );
  };

  // Expose tracking globally for onclick
  if (typeof window !== "undefined") {
    window.__trackCTA = handleCTAClick;
  }

  // Build JSON-LD structured data
  const articleUrl = `${window.location.origin}/BlogPost?slug=${article.slug}`;
  const keywords = [article.primary_keyword, ...(article.secondary_keywords || [])].filter(Boolean).join(", ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.meta_description || "",
    "datePublished": article.publish_date || article.created_date,
    "dateModified": article.updated_date || article.publish_date || article.created_date,
    "keywords": keywords,
    "mainEntityOfPage": { "@type": "WebPage", "@id": articleUrl },
    "author": { "@type": "Organization", "name": "Contractor Profitability Suite" },
    "publisher": { "@type": "Organization", "name": "Contractor Profitability Suite" }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      {/* Top nav */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl("Resources")} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm">
            <ArrowLeft className="w-4 h-4" /> All Articles
          </Link>
          <Link
            to={createPageUrl("Billing")}
            onClick={handleCTAClick}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Try Free Calculator
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
          {article.publish_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.publish_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          )}
          {wordCount > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readTime} min read
            </span>
          )}
          {article.primary_keyword && (
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {article.primary_keyword}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-blue-600"
          dangerouslySetInnerHTML={{ __html: injectCtaTracking(sanitizeHtml(article.content || "")) }}
        />

        {/* Bottom CTA */}
        <div className="mt-12 bg-blue-700 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Ready to Stop Losing Money on Change Orders?</h3>
          <p className="text-blue-100 mb-6">Join contractors who protect their margins with every job.</p>
          <Link
            to={createPageUrl("Billing")}
            onClick={handleCTAClick}
            className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-xl text-lg hover:bg-blue-50 transition-colors"
          >
            Start Free Today →
          </Link>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="border-t bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedArticles.map(a => (
                <Link
                  key={a.id}
                  to={`${createPageUrl("BlogPost")}?slug=${a.slug}`}
                  className="bg-white rounded-lg border p-4 hover:shadow-sm hover:border-blue-300 transition-all group"
                >
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 leading-snug mb-1">
                    {a.title || a.primary_keyword}
                  </p>
                  <span className="text-blue-600 text-xs flex items-center gap-1 mt-2">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}