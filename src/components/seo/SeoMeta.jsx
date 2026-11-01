import { useEffect } from "react";

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets standard SEO meta tags for a public marketing page:
 * document title, meta description, Open Graph tags, and canonical link.
 * Also clears any noindex robots meta so public pages stay indexable.
 */
export default function SeoMeta({ title, description, canonical, ogType = "website" }) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", ogType);
    setLink("canonical", canonical);

    const tags = document.querySelectorAll('meta[name="robots"]');
    tags.forEach((t) => {
      const c = t.getAttribute("content") || "";
      if (c.includes("noindex")) t.remove();
    });

    return () => {
      document.title = "Contractor Profitability Suite";
    };
  }, [title, description, canonical, ogType]);

  return null;
}

export function useSeoTitle(title) {
  useEffect(() => {
    if (title) document.title = title;
    return () => {
      document.title = "Contractor Profitability Suite";
    };
  }, [title]);
}