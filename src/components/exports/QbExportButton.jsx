import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable "Export to QuickBooks" button.
 * @param {() => string} buildCsv - returns the CSV string to download
 * @param {string} filename - download file name
 * @param {string} label - button label
 */
export default function QbExportButton({
  buildCsv,
  filename,
  label = "Export to QuickBooks",
  variant = "outline",
  className,
}) {
  const [done, setDone] = useState(false);

  const onClick = () => {
    const csv = buildCsv();
    if (!csv) return;
    import("@/lib/qbExport").then(({ triggerDownload }) => {
      triggerDownload(filename, csv);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    });
  };

  return (
    <Button variant={variant} onClick={onClick} className={cn("gap-1.5", className)}>
      {done ? <Check className="h-4 w-4 text-emerald-600" /> : <Download className="h-4 w-4" />}
      {done ? "Exported" : label}
    </Button>
  );
}