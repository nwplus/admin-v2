import { PageHeader } from "@/components/graphy/typo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddMembers from "@/components/features/factotum/add-members";
import AddDiscordQuestions from "@/components/features/factotum/add-discord-questions";
import CheckedInTable from "@/components/features/factotum/checkedin-table";
import DevConfig from "@/components/features/factotum/dev-config";
import { FactotumProvider, useFactotum } from "@/providers/factotum-provider";
import { getGuilds } from "@/services/dev-config";
import { Loading } from "@/components/ui/loading";

export const Route = createFileRoute("/_auth/factotum")({
  component: RouteComponent,
});

function RouteComponent() {

  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("Add Members");
  const [hackathons, setHackathons] = useState<string[]>([])
  const [currentHackathon, setCurrentHackathon] = useState<string>("");
  const [loading, setLoading] = useState(true)

  // const handleCopy = () => {
  //   navigator.clipboard.writeText(useFactotum().id); 
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000);
  // };

  useEffect(() => {
    const getListOfGuilds = async () => {
      const guilds = await getGuilds()
      setHackathons(guilds)
      if (guilds.length) {
        setCurrentHackathon(guilds[0])
        setLoading(false)
      }
    }
    getListOfGuilds()
  }, [])

  return (
    <>
      {loading ? (
        <Loading variant="small" />
      ) : (
        <FactotumProvider id={currentHackathon} key = {currentHackathon}>
          <div className="flex h-full w-full flex-col gap-3">
            <div className="flex items-center justify-between ">
              <PageHeader className="flex items-center gap-3">Factotum</PageHeader>
            </div>

            <div className="flex items-center justify-between my-5">
              <div className="flex gap-5">
                <div>
                  <Label className="text-black text-md mb-2 font-bold">Select your Hackathon</Label>
                  <Select value={currentHackathon} onValueChange={setCurrentHackathon}>
                    <SelectTrigger className="w-56 text-black border-2 border-gray-300 focus-visible:border-gray-300">
                      <SelectValue className="text-black"/>
                    </SelectTrigger>
                    <SelectContent>
                      {hackathons.map((curr) => <SelectItem key={curr} value={curr}>{curr}</SelectItem> )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs defaultValue="Add Members" className="mt-8">
                <TabsList>
                  <TabsTrigger value="Add Members" onClick={() => setTab("Add Members")}>Add Members</TabsTrigger>
                  <TabsTrigger value="Add Discord Questions" onClick={() => setTab("Add Discord Questions")}>Add Discord Questions</TabsTrigger>
                  <TabsTrigger value="Checked-In Table" onClick={() => setTab("Checked-In Table")}>Checked-In Table</TabsTrigger>
                  <TabsTrigger value="Dev Configuration" onClick={() => setTab("Dev Configuration")}>Dev Configuration</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {tab === "Add Members" && <AddMembers />}
            {tab === "Add Discord Questions" && <AddDiscordQuestions />}
            {tab === "Checked-In Table" && <CheckedInTable />}
            {tab === "Dev Configuration" && <DevConfig />}
          </div>
        </FactotumProvider>
      )}
    </>
  );
}

