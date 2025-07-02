import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useQuery } from "@/providers/query-provider";

/**
 * Dropdown to select a hackathon for the query page.
 */
export function HackathonSelector() {
  const { hackathons, selectedHackathon, setSelectedHackathon, applicants } = useQuery();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
          <SelectTrigger className="h-auto w-auto border-none p-0 shadow-none">
            <span
              className="max-w-[200px] truncate font-semibold text-lg sm:text-xl"
              title={selectedHackathon || "Select Hackathon"}
            >
              {selectedHackathon || "Select Hackathon"}
            </span>
          </SelectTrigger>
          <SelectContent align="start">
            {hackathons.length === 0 ? (
              <SelectItem value="none" disabled>
                No hackathons available
              </SelectItem>
            ) : (
              hackathons.map((hackathon) => (
                <SelectItem key={hackathon._id} value={hackathon._id}>
                  {hackathon._id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      {selectedHackathon && (
        <div className="text-gray-500 text-xs">{applicants.length} Applicants</div>
      )}
    </div>
  );
}
