import DOMPurify from "dompurify";

/**
 * HTML sanitizer backed by DOMPurify.
 * Strips <script> tags, event handler attributes (onerror, onload, etc.),
 * javascript:/data: URLs, and all non-allowlisted tags/attributes.
 */
export function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(String(html), {
    ALLOWED_TAGS: [
      "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "table", "thead", "tbody", "tfoot", "tr", "td", "th",
      "strong", "em", "b", "i", "u", "span", "div", "blockquote", "pre", "code",
      "a", "img", "figure", "figcaption", "caption", "colgroup", "col",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "width", "height", "class",
      "colspan", "rowspan", "target", "rel",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
}