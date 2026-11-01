import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProposalList from "@/components/proposals/ProposalList";
import ProposalForm from "@/components/proposals/ProposalForm";
import ProposalDetail from "@/components/proposals/ProposalDetail";

export default function Proposals() {
  const { customer: user, isLoading } = useCustomerAuth();
  const [view, setView] = useState("list"); // list | form | detail
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [prefillData, setPrefillData] = useState(null);
  const queryClient = useQueryClient();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: proposals = [], refetch } = useQuery({
    queryKey: ["proposals", user?.id],
    queryFn: () => base44.entities.Proposal.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const monthlyCount = proposals.filter(p => p.month_generated === currentMonth).length;

  const handleNewProposal = () => {
    setPrefillData(null);
    setView("form");
  };

  const handleSaved = async () => {
    await refetch();
    setView("list");
  };

  const handleView = (proposal) => {
    setSelectedProposal(proposal);
    setView("detail");
  };

  const handleRegenerate = (proposal) => {
    setPrefillData(proposal);
    setView("form");
  };

  const handleBack = async () => {
    await refetch();
    setView("list");
    setSelectedProposal(null);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) return <div className="p-8 text-center text-muted-foreground">Please log in to use proposals.</div>;

  if (view === "form") {
    return (
      <ProposalForm
        user={user}
        monthlyCount={monthlyCount}
        prefillData={prefillData}
        onSaved={handleSaved}
        onBack={() => setView("list")}
      />
    );
  }

  if (view === "detail" && selectedProposal) {
    return (
      <ProposalDetail
        proposal={selectedProposal}
        onBack={handleBack}
        onRegenerate={handleRegenerate}
      />
    );
  }

  return (
    <ProposalList
      proposals={proposals}
      monthlyCount={monthlyCount}
      user={user}
      onNew={handleNewProposal}
      onView={handleView}
      onRefetch={refetch}
    />
  );
}