import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LivesiteSettings } from '@/components/features/livesite/livesite-settings'
import { LivesiteSchedule } from '@/components/features/livesite/livesite-schedule'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export const Route = createFileRoute('/_auth/livesite')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex w-full flex-col gap-3">
      <h1 className="font-bold text-3xl">Livesite</h1>
      <Alert>
        <AlertDescription>
            <p className="flex items-center"><Info className="mr-2 inline h-4 w-4" />This page is used to manage content and feature flags for the currently live hackathon, which will be displayed on Portal and the nwPlus website.</p>
        </AlertDescription>
      </Alert>
      
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
