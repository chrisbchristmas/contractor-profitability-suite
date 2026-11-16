import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PriceList() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", unit: "ea", unit_cost: "" });
  const { data: items = [] } = useQuery({ queryKey: ["materialItems"], queryFn: () => base44.entities.MaterialItem.list("name") });
  const done = () => queryClient.invalidateQueries({ queryKey: ["materialItems"] });

  const add = useMutation({
    mutationFn: (d) => base44.entities.MaterialItem.create(d),
    onSuccess: () => { done(); setForm({ name: "", unit: "ea", unit_cost: "" }); },
    onError: (e) => toast.error(e?.message || "Couldn't save item"),
  });
  const del = useMutation({ mutationFn: (id) => base44.entities.MaterialItem.delete(id), onSuccess: done });

  const submit = (e) => {
    e.preventDefault();
    const unit_cost = parseFloat(form.unit_cost);
    if (!form.name.trim() || !(unit_cost >= 0)) return;
    add.mutate({ name: form.name.trim(), unit: form.unit.trim() || "ea", unit_cost });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Material Price List</CardTitle>
        <CardDescription>Your usual material costs — pick them when logging job costs instead of retyping.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
            <span>{it.name} <span className="text-muted-foreground">/ {it.unit}</span></span>
            <span className="flex items-center gap-2">
              ${Number(it.unit_cost).toFixed(2)}
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Delete ${it.name}`} onClick={() => del.mutate(it.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </span>
          </div>
        ))}
        <form onSubmit={submit} className="flex gap-2">
          <Input placeholder="Item (e.g. 2x4x8 stud)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Item name" />
          <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-20" aria-label="Unit" />
          <Input type="number" step="0.01" min="0" placeholder="$" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} className="w-24" aria-label="Unit cost" />
          <Button type="submit" size="icon" disabled={add.isPending} aria-label="Add item"><Plus className="h-4 w-4" /></Button>
        </form>
      </CardContent>
    </Card>
  );
}
