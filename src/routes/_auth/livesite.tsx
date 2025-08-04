import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LivesiteSettings } from '@/components/features/livesite/livesite-settings'
import { LivesiteSchedule } from '@/components/features/livesite/livesite-schedule'

export const Route = createFileRoute('/_auth/livesite')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex w-full flex-col gap-3">
      <h1 className="font-bold text-3xl">Livesite</h1>
      
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="judging">Judging</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-6">
          <LivesiteSettings />
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-6">
          <LivesiteSchedule />
        </TabsContent>
        
        <TabsContent value="judging" className="mt-6">
          <div className="space-y-4">
            <h2 className="font-semibold text-xl">Judging</h2>
            <p className="text-muted-foreground">Coming soon! (´･ω･`)</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
