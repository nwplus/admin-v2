import { createFileRoute } from '@tanstack/react-router'
import { HackathonSettingsForm } from '@/components/features/settings/hackathon-settings-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export const Route = createFileRoute('/_auth/hackathons/$hackathonId/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const { hackathonId } = Route.useParams()

  return (
    <div className="flex w-full flex-col gap-3">
      <h1 className="font-bold text-3xl">Settings</h1>
      <Alert>
        <AlertDescription>
            <p className="flex items-center"><Info className="mr-2 inline h-4 w-4" />Configure settings and feature flags for {hackathonId} that will affect display on Portal and the nwPlus website.</p>
        </AlertDescription>
      </Alert>
      
      <HackathonSettingsForm hackathonId={hackathonId} />
    </div>
  )
}