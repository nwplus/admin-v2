import AddDiscordQuestions from "@/components/features/factotum/add-discord-questions";
import AddMembers from "@/components/features/factotum/add-members";
import CheckedInTable from "@/components/features/factotum/checkedin-table";
import DevConfig from "@/components/features/factotum/dev-config";
import { PageHeader } from "@/components/graphy/typo";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FactotumProvider } from "@/providers/factotum-provider";
import { getGuilds } from "@/services/factotum";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_auth/factotum")({
  component: RouteComponent,
});

function RouteComponent() {
  const [hackathons, setHackathons] = useState<{ id: string; hackathonName: string }[]>([]);
  const [currentHackathon, setCurrentHackathon] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getListOfGuilds = async () => {
      const guilds = await getGuilds();
      setHackathons(guilds);
      if (guilds.length) {
        setCurrentHackathon(guilds[0].id);
        setLoading(false);
      }
    };
    getListOfGuilds();
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        //take out key when real full data is available. No full rerenders needed
        <FactotumProvider server={currentHackathon} key={currentHackathon}>
          <div className="flex h-full w-full flex-col gap-3">
            <div className="flex items-center justify-between ">
              <PageHeader className="flex items-center gap-3">Factotum</PageHeader>
            </div>

            <Tabs defaultValue="Add Members" className="flborder">
              <div className="my-5 flex items-center justify-between">
                <div className="flex gap-5">
                  <div>
                    <Label className="mb-2 font-bold text-black text-md">
                      Select your Hackathon
                    </Label>
                    <Select value={currentHackathon} onValueChange={setCurrentHackathon}>
                      <SelectTrigger className="w-56 border-2 border-gray-300 text-black focus-visible:border-gray-300">
                        <SelectValue className="text-black" />
                      </SelectTrigger>
                      <SelectContent>
                        {hackathons.map((curr) => (
                          <SelectItem key={curr.id} value={curr.id}>
                            {curr.hackathonName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsList className="w-fit">
                  <TabsTrigger value="Add Members">Add Members</TabsTrigger>
                  <TabsTrigger value="Add Discord Questions">Add Discord Questions</TabsTrigger>
                  <TabsTrigger value="Checked-In Table">Checked-In Table</TabsTrigger>
                  <TabsTrigger value="Dev Configuration">Dev Configuration</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1">
                <TabsContent value="Add Members" className="h-full">
                  <AddMembers />
                </TabsContent>
                <TabsContent value="Add Discord Questions" className="h-full">
                  <AddDiscordQuestions />
                </TabsContent>
                <TabsContent value="Checked-In Table" className="h-full">
                  <CheckedInTable />
                </TabsContent>
                <TabsContent value="Dev Configuration" className="h-full">
                  <DevConfig />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </FactotumProvider>
      )}
    </>
  );
}
