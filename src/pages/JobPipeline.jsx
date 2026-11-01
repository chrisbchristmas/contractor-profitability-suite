import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateJobMargins, calculateJobDirectMetrics } from "@/components/changeorders/CalculationEngine";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KanbanSquare, AlertTriangle } from "lucide-react";

const COLUMNS = [
  { id: "Bidding", title: "Bidding", color: "bg-slate-100 text-slate-700" },
  { id: "Active", title: "Active", color: "bg-blue-100 text-blue-700" },
  { id: "Punch List", title: "Punch List", color: "bg-amber-100 text-amber-700" },
  { id: "Complete", title: "Complete", color: "bg-emerald-100 text-emerald-700" },
  { id: "Invoiced", title: "Invoiced", color: "bg-violet-100 text-violet-700" },
];

function fmt(n) {
  return (n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function JobPipeline() {
  const queryClient = useQueryClient();
  const [coMap, setCoMap] = useState({});

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs-pipeline"],
    queryFn: async () => {
      const list = await base44.entities.Job.list("-created_date", 200);
      const cosByJob = {};
      await Promise.all(
        list.map(async (j) => {
          const cos = await base44.entities.ChangeOrder.filter({ job_id: j.id });
          cosByJob[j.id] = cos;
        })
      );
      setCoMap(cosByJob);
      return list;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, newStatus }) => {
      await base44.entities.Job.update(jobId, { pipeline_status: newStatus });
    },
    onMutate: async ({ jobId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["jobs-pipeline"] });
      const previous = queryClient.getQueryData(["jobs-pipeline"]);
      queryClient.setQueryData(["jobs-pipeline"], (old = []) =>
        old.map((j) => (j.id === jobId ? { ...j, pipeline_status: newStatus } : j))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["jobs-pipeline"], ctx.previous);
      toast.error("Failed to update job status.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs-pipeline"] });
    },
  });

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    updateStatusMutation.mutate({ jobId: draggableId, newStatus });
  };

  const getJobMetrics = (job) => {
    const cos = coMap[job.id] || [];
    const margins = calculateJobMargins(job, cos);
    const leakage = cos.reduce((s, co) => s + (co.leakage_amount || 0), 0);
    return { margin: margins?.realTimeMargin ?? 0, leakage };
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-4 overflow-x-auto">
          {COLUMNS.map((c) => (
            <Skeleton key={c.id} className="h-[500px] w-72 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <KanbanSquare className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Job Pipeline</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Drag jobs between columns to update their pipeline status.
        </p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colJobs = jobs.filter((j) => (j.pipeline_status || "Active") === col.id);
            return (
              <div key={col.id} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold", col.color)}>
                      {col.title}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{colJobs.length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[400px] rounded-xl border border-border p-2 space-y-2 transition-colors",
                        snapshot.isDraggingOver ? "bg-blue-50/50 border-blue-300" : "bg-muted/30"
                      )}
                    >
                      {colJobs.map((job, idx) => (
                        <PipelineJobCard key={job.id} job={job} index={idx} metrics={getJobMetrics(job)} />
                      ))}
                      {provided.placeholder}
                      {colJobs.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-muted-foreground text-center py-8">Drop jobs here</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

function PipelineJobCard({ job, index, metrics }) {
  const { margin, leakage } = metrics;
  const marginColor = margin >= 25 ? "text-emerald-600" : margin >= 15 ? "text-amber-600" : "text-red-600";

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <Link
          to={createPageUrl("JobDetail") + `?id=${job.id}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "block bg-card rounded-lg border border-border p-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing",
            snapshot.isDragging && "shadow-lg ring-2 ring-blue-300"
          )}
        >
          <p className="font-semibold text-sm text-foreground truncate mb-2">{job.job_name}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Contract</span>
              <span className="text-xs font-semibold text-foreground">${fmt(job.contract_value)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Margin</span>
              <span className={cn("text-xs font-bold", marginColor)}>{margin.toFixed(1)}%</span>
            </div>
            {leakage > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Leakage</span>
                <span className="text-xs font-semibold text-red-600 flex items-center gap-0.5">
                  <AlertTriangle className="h-3 w-3" />${fmt(leakage)}
                </span>
              </div>
            )}
          </div>
        </Link>
      )}
    </Draggable>
  );
}