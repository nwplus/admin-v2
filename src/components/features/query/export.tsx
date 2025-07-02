import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useCallback } from "react";
import { useQuery } from "@/providers/query-provider";

/**
 * Provides an button to export queried applicant (table) data to a CSV file.
 */
export function ExportQuery() {
  const { selectedHackathon, tableData } = useQuery();

  const handleExport = useCallback(() => {
    if (tableData.length === 0) {
      return;
    }

    const headers = Object.keys(tableData[0]);
    const csvContent = [
      headers.join(","),
      ...tableData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedHackathon}_applicants_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [tableData, selectedHackathon]);

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={tableData.length === 0}
      className="w-full sm:w-auto"
      size="sm"
    >
      <Download className="mr-2 h-4 w-4 flex-shrink-0" />
      Export
    </Button>
  );
}
