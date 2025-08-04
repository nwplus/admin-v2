import { subscribeToLivesiteSettings, updateLivesiteSettings } from '@/services/livesite'
import type { LivesiteSettings as LivesiteSettingsType } from '@/lib/firebase/types'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Pencil, Save, X } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Settings for portal and www associated with the active hackathon
 */
export function LivesiteSettings() {
  const [livesiteSettings, setLivesiteSettings] = useState<LivesiteSettingsType | null>(null)
  const [editedSettings, setEditedSettings] = useState<LivesiteSettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToLivesiteSettings((data) => {
      setLivesiteSettings(data)
      setEditedSettings(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const formatTimestamp = (timestamp?: any) => {
    if (!timestamp) return 'Not set'
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString()
    }
    return timestamp.toString()
  }

  /**
   * Helpers to convert firebase ISO date to datetime-local
   */
  const toDateTimeLocal = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  const fromDateTimeLocal = (dateTimeLocal: string) => {
    if (!dateTimeLocal) return ''
    try {
      const date = new Date(dateTimeLocal)
      return date.toISOString()
    } catch {
      return ''
    }
  }

  const handleEdit = () => {
    setEditedSettings(livesiteSettings)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editedSettings) return
    
    setIsSaving(true)
    try {
      await updateLivesiteSettings(editedSettings)
      setIsEditing(false)
      toast.success('Livesite settings updated successfully')
    } catch (error) {
      console.error('Error saving livesite settings:', error)
      toast.error('Failed to save livesite settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedSettings(livesiteSettings)
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof LivesiteSettingsType, value: string | boolean) => {
    if (!editedSettings) return
    
    if (typeof value === 'string' && ['hackathonStart', 'hackathonEnd', 'hackingStart', 'hackingEnd'].includes(field)) {
      value = fromDateTimeLocal(value)
    }
    
    setEditedSettings({
      ...editedSettings,
      [field]: value
    })
  }

  const currentSettings = isEditing ? editedSettings : livesiteSettings

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Livesite Settings</h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="flex items-center gap-1">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving} className="flex items-center gap-1">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={handleEdit} className="flex items-center gap-1">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
      
      {livesiteSettings && (
        <p className="text-sm text-muted-foreground">
          Last edited by {livesiteSettings.lastEditedBy || 'Unknown'} on {formatTimestamp(livesiteSettings.lastEdited)}
        </p>
      )}
      
      {loading ? (
        <p className="text-muted-foreground">Loading settings...</p>
      ) : !currentSettings ? (
        <p className="text-muted-foreground">No livesite settings found.</p>
      ) : (
        <div className="border rounded-lg p-6">
          <div className="flex gap-8 pb-8 border-b">
            <div className="w-48 flex-shrink-0">
              <h3 className="text-lg font-semibold">General Information</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activeHackathon">Active Hackathon</Label>
                <Input
                  id="activeHackathon"
                  value={currentSettings.activeHackathon || ''}
                  onChange={(e) => handleInputChange('activeHackathon', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter active hackathon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackathonWeekend">Hackathon Weekend</Label>
                <Input
                  id="hackathonWeekend"
                  value={currentSettings.hackathonWeekend || ''}
                  onChange={(e) => handleInputChange('hackathonWeekend', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hackathon weekend"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="livePortalLink">Live Portal Link</Label>
                <Input
                  id="livePortalLink"
                  value={currentSettings.livePortalLink || ''}
                  onChange={(e) => handleInputChange('livePortalLink', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter live portal link"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 py-8 border-b">
            <div className="w-48 flex-shrink-0">
              <h3 className="text-lg font-semibold">Hacker Application Status</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="applicationsOpen">Applications Open</Label>
                <Switch
                  id="applicationsOpen"
                  checked={currentSettings.applicationsOpen || false}
                  onCheckedChange={(checked) => handleInputChange('applicationsOpen', checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input
                  id="applicationDeadline"
                  value={currentSettings.applicationDeadline || ''}
                  onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter application deadline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsvpBy">RSVP By</Label>
                <Input
                  id="rsvpBy"
                  value={currentSettings.rsvpBy || ''}
                  onChange={(e) => handleInputChange('rsvpBy', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter RSVP deadline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offWaitlistNotify">Off Waitlist Notify</Label>
                <Input
                  id="offWaitlistNotify"
                  value={currentSettings.offWaitlistNotify || ''}
                  onChange={(e) => handleInputChange('offWaitlistNotify', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter off waitlist notification time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sendAcceptancesBy">Send Acceptances By</Label>
                <Input
                  id="sendAcceptancesBy"
                  value={currentSettings.sendAcceptancesBy || ''}
                  onChange={(e) => handleInputChange('sendAcceptancesBy', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter send acceptances deadline"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 py-8 border-b">
            <div className="w-48 flex-shrink-0">
              <h3 className="text-lg font-semibold">Event Timeline</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hackathonStart">Hackathon Start</Label>
                <Input
                  id="hackathonStart"
                  value={toDateTimeLocal(currentSettings.hackathonStart)}
                  onChange={(e) => handleInputChange('hackathonStart', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hackathon start time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackathonEnd">Hackathon End</Label>
                <Input
                  id="hackathonEnd"
                  value={toDateTimeLocal(currentSettings.hackathonEnd)}
                  onChange={(e) => handleInputChange('hackathonEnd', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hackathon end time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackingStart">Hacking Start</Label>
                <Input
                  id="hackingStart"
                  value={toDateTimeLocal(currentSettings.hackingStart)}
                  onChange={(e) => handleInputChange('hackingStart', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hacking start time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackingEnd">Hacking End</Label>
                <Input
                  id="hackingEnd"
                  value={toDateTimeLocal(currentSettings.hackingEnd)}
                  onChange={(e) => handleInputChange('hackingEnd', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hacking end time"
                  type="datetime-local"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 pt-8">
            <div className="w-48 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold">Judging & Submissions</h3>
                <p className="text-sm text-muted-foreground mt-1">(Peer) judging is currently only supported for Hackcamp</p>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="submissionsOpen">Submissions Open</Label>
                <Switch
                  id="submissionsOpen"
                  checked={currentSettings.submissionsOpen || false}
                  onCheckedChange={(checked) => handleInputChange('submissionsOpen', checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="judgingOpen">Judging Open</Label>
                <Switch
                  id="judgingOpen"
                  checked={currentSettings.judgingOpen || false}
                  onCheckedChange={(checked) => handleInputChange('judgingOpen', checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="judgingReleased">Judging Released</Label>
                <Switch
                  id="judgingReleased"
                  checked={currentSettings.judgingReleased || false}
                  onCheckedChange={(checked) => handleInputChange('judgingReleased', checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
