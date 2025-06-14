import { PageHeader } from "@/components/graphy/typo";
import { QueryInterface } from "@/components/features/query/query-interface";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/query")({
  component: QueryPage,
});

function QueryPage() {
  const handleExport = (data: any[], hackathon: string) => {
    
    if (data.length === 0) {
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${hackathon}_applicants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRaffle = (data: any[], hackathon: string) => {
    console.log(`Running raffle for ${hackathon} with ${data.length} applicants...`);
    
    if (data.length === 0) {
      alert("No applicants available for raffle");
      return;
    }
    
    const eligibleApplicants = data.filter(applicant => 
      applicant.applicationStatus === "acceptedAndAttending"
    );
    
    if (eligibleApplicants.length === 0) {
      alert("No eligible applicants (acceptedAndAttending) for raffle");
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * eligibleApplicants.length);
    const winner = eligibleApplicants[randomIndex];
    
    alert(`🎉 Raffle Winner: ${winner.firstName} ${winner.lastName} (${winner.email})`);
  };

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <PageHeader className="flex items-center gap-3">Query</PageHeader>
      </div>
      <div className="flex-1">
        <QueryInterface
          onExport={handleExport}
          onRaffle={handleRaffle}
        />
      </div>
    </div>
  );
}
