/**
 * Safely serialize a JSON-LD object for embedding inside a <script type="application/ld+json"> block.
 *
 * JSON.stringify() does not escape the sequence `</script>`, so if any field value
 * contains that string it breaks out of the script element and allows script injection.
 * The same risk exists with `<!--` which can escape the script context in some parsers.
 *
 * This helper stringifies the object and then Unicode-escapes the dangerous substrings
 * so the output is safe to inject via dangerouslySetInnerHTML.
 */
export function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/<\/script/gi, "<\\u002fscript")
    .replace(/<!--/g, "<\\u0021--");
}