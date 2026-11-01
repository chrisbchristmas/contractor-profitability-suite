import React, { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * MobileSelect: renders a standard Select on desktop, a Drawer on mobile.
 * Props mirror a simple Select: value, onValueChange, placeholder, options=[{value, label}], triggerClassName
 */
export default function MobileSelect({ value, onValueChange, placeholder, options = [], triggerClassName, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder ?? "Select...";

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className={cn(
          "flex items-center justify-between h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm text-left select-none",
          triggerClassName
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{selectedLabel}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{placeholder || "Select an option"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-1">
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setDrawerOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  o.value === value ? "bg-blue-50 text-blue-700" : "hover:bg-slate-100 text-slate-800"
                )}
              >
                {o.label}
                {o.value === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}