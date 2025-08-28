import { subscribeToHackathonConfig, updateHackathonConfig } from '@/services/hackathon-settings'
import type { HackathonConfig, HackathonConfigMap, HackathonBooleanMap, WaiversAndFormsMap, NotionLinksMap } from '@/lib/firebase/types'
import { splitHackathon, formatTimestamp } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface HackathonSettingsFormProps {
  hackathonId: string;
}

/**
 * Converts hackathonId to the correct HackathonType for the data model
 */
const getHackathonTypeFromId = (id: string): 'cmd-f' | 'hackcamp' | 'nwhacks' => {
  const lowerName = id.toLowerCase();
  if (lowerName.includes('cmd-f')) return 'cmd-f';
  if (lowerName.includes('hackcamp')) return 'hackcamp';
  if (lowerName.includes('nwhacks')) return 'nwhacks';
  return 'nwhacks'; // Default fallback
};

/**
 * Settings form for a specific hackathon
 */
export function HackathonSettingsForm({ hackathonId }: HackathonSettingsFormProps) {
  const [config, setConfig] = useState<HackathonConfig | null>(null)
  const [editedConfig, setEditedConfig] = useState<HackathonConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const hackathonType = getHackathonTypeFromId(hackathonId);

  useEffect(() => {
    const unsubscribe = subscribeToHackathonConfig((data) => {
      setConfig(data)
      setEditedConfig(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleEdit = () => {
    setEditedConfig(config)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editedConfig) return
    
    setIsSaving(true)
    try {
      await updateHackathonConfig(editedConfig)
      setIsEditing(false)
      toast.success(`${hackathonId} settings updated successfully`)
    } catch (error) {
      console.error('Error saving hackathon settings:', error)
      toast.error('Failed to save hackathon settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedConfig(config)
    setIsEditing(false)
  }

  /**
   * Generic handler for edited HackathonConfig fields
   * @param field - field to edit
   * @param value - value to set the field to
   * @param nestedField - nested field to edit i.e. notionLinks.preHackathonWorkshops
   */
  const handleFieldChange = (field: keyof HackathonConfig, value: string | boolean, nestedField?: string) => {
    if (!editedConfig) return
    
    let processedValue = value
    if (typeof value === 'string' && ['hackathonStart', 'hackathonEnd', 'hackingStart', 'hackingEnd'].includes(field)) {
      processedValue = value ? new Date(value).toISOString() : ''
    }
    
    const currentValue = editedConfig[field]
    const isMapField = typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)
    
    if (nestedField) {
      const hackathonValue = (currentValue as HackathonConfigMap | WaiversAndFormsMap | NotionLinksMap)?.[hackathonType] || {}
      const updatedMap = {
        ...(currentValue as object),
        [hackathonType]: {
          ...hackathonValue,
          [nestedField]: processedValue
        }
      }
      setEditedConfig({ ...editedConfig, [field]: updatedMap as unknown as typeof currentValue })
    } else if (isMapField) {
      const updatedMap = { ...(currentValue as object), [hackathonType]: processedValue }
      setEditedConfig({ ...editedConfig, [field]: updatedMap as unknown as typeof currentValue })
    } else {
      setEditedConfig({ ...editedConfig, [field]: processedValue as unknown as typeof currentValue })
    }
  }

  const currentConfig = isEditing ? editedConfig : config

  /**
   * Convert ISO string to datetime-local format for HTML input
   */
  const toDateTimeLocalFormat = (isoString: string): string => {
    return isoString ? new Date(isoString).toISOString().slice(0, 16) : ''
  }

  /**
   * Generic getter for hackathon-specific values
   * @param field - field to get the value of
   * @param nestedField - nested field to get the value of i.e. notionLinks.preHackathonWorkshops
   * @returns value of the field or empty string if not found
   */
  const getValue = (field: keyof HackathonConfig, nestedField?: string): string => {
    const value = currentConfig?.[field]
    const isMapField = typeof value === 'object' && value !== null && !Array.isArray(value)
    
    if (nestedField) {
      // Need to cast to corresponding maps to avoid type errors
      const hackathonValue = (value as WaiversAndFormsMap | NotionLinksMap)?.[hackathonType]
      return hackathonValue?.[nestedField as keyof typeof hackathonValue] ?? ''
    }
    if (isMapField) {
      return (value as HackathonConfigMap)[hackathonType] ?? ''
    }
    return (value as string) ?? ''
  }

  /**
   * Generic getter for boolean values corresponding to toggle fields
   */
  const getBooleanValue = (field: keyof HackathonConfig): boolean => {
    const value = currentConfig?.[field]
    const isMapField = typeof value === 'object' && value !== null && !Array.isArray(value)
    
    if (isMapField) {
      return (value as HackathonBooleanMap)[hackathonType] ?? false
    }
    return typeof value === 'boolean' ? value : false
  }

  

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">{splitHackathon(hackathonId).join(' ')} Settings</h2>
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
              
        {config && (
          <p className="text-muted-foreground text-sm">
            Last edited by {config.lastEditedBy || 'Unknown'} on {formatTimestamp(config.lastEdited)}
          </p>
        )}
        
        {loading ? (
          <p className="text-muted-foreground">Loading settings...</p>
        ) : !currentConfig ? (
          <p className="text-muted-foreground">No settings found.</p>
        ) : (
        <div className="rounded-lg border p-6">
          <div className="flex gap-8 border-b pb-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">General Information</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hackathonWeekend">Hackathon Weekend</Label>
                <Input
                  id="hackathonWeekend"
                  value={getValue('hackathonWeekend')}
                  onChange={(e) => handleFieldChange('hackathonWeekend', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 8-9"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="portalLive">Portal Live</Label>
                <Switch
                  id="portalLive"
                  checked={getBooleanValue('portalLive')}
                  onCheckedChange={(checked) => handleFieldChange('portalLive', checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b py-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">Hacker Application Status</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="applicationsOpen">Applications Open</Label>
                <Switch
                  id="applicationsOpen"
                  checked={getBooleanValue('applicationsOpen')}
                  onCheckedChange={(checked) => handleFieldChange('applicationsOpen', checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input
                  id="applicationDeadline"
                  value={getValue('applicationDeadline')}
                  onChange={(e) => handleFieldChange('applicationDeadline', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 5th, 2025 at 11:59 PM (Pacific Time)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsvpBy">RSVP By</Label>
                <Input
                  id="rsvpBy"
                  value={getValue('rsvpBy')}
                  onChange={(e) => handleFieldChange('rsvpBy', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 5th at 11:59 PM (Pacific Time)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offWaitlistNotify">Off Waitlist Notify</Label>
                <Input
                  id="offWaitlistNotify"
                  value={getValue('offWaitlistNotify')}
                  onChange={(e) => handleFieldChange('offWaitlistNotify', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 2nd at 11:59 PM (Pacific Time)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sendAcceptancesBy">Send Acceptances By</Label>
                <Input
                  id="sendAcceptancesBy"
                  value={getValue('sendAcceptancesBy')}
                  onChange={(e) => handleFieldChange('sendAcceptancesBy', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., late February"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b py-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">Event Timeline</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hackathonStart">Hackathon Start</Label>
                <Input
                  id="hackathonStart"
                  value={toDateTimeLocalFormat(getValue('hackathonStart'))}
                  onChange={(e) => handleFieldChange('hackathonStart', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hackathon start time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackathonEnd">Hackathon End</Label>
                <Input
                  id="hackathonEnd"
                  value={toDateTimeLocalFormat(getValue('hackathonEnd'))}
                  onChange={(e) => handleFieldChange('hackathonEnd', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hackathon end time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackingStart">Hacking Start</Label>
                <Input
                  id="hackingStart"
                  value={toDateTimeLocalFormat(getValue('hackingStart'))}
                  onChange={(e) => handleFieldChange('hackingStart', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hacking start time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackingEnd">Hacking End</Label>
                <Input
                  id="hackingEnd"
                  value={toDateTimeLocalFormat(getValue('hackingEnd'))}
                  onChange={(e) => handleFieldChange('hackingEnd', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hacking end time"
                  type="datetime-local"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b py-8">
            <div className="w-48 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-lg">Judging & Submissions</h3>
                <p className="mt-1 text-muted-foreground text-sm">(Peer) judging is currently only supported for Hackcamp</p>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="submissionsOpen">Submissions Open</Label>
                <Switch
                  id="submissionsOpen"
                  checked={getBooleanValue('submissionsOpen')}
                  onCheckedChange={(checked) => handleFieldChange('submissionsOpen', checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="judgingOpen">Judging Open</Label>
                <Switch
                  id="judgingOpen"
                  checked={getBooleanValue('judgingOpen')}
                  onCheckedChange={(checked) => handleFieldChange('judgingOpen', checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="judgingReleased">Judging Released</Label>
                <Switch
                  id="judgingReleased"
                  checked={getBooleanValue('judgingReleased')}
                  onCheckedChange={(checked) => handleFieldChange('judgingReleased', checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b py-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">Notion Links</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preHackathonWorkshops">Pre-Hackathon Workshops</Label>
                <Input
                  id="preHackathonWorkshops"
                  value={getValue('notionLinks', 'preHackathonWorkshops')}
                  onChange={(e) => handleFieldChange('notionLinks', e.target.value, 'preHackathonWorkshops')}
                  disabled={!isEditing}
                  placeholder="Enter Notion link for pre-hackathon workshops"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 pt-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">Waivers & Forms</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="covid">COVID Waiver</Label>
                <Textarea
                  id="covid"
                  value={getValue('waiversAndForms', 'covid')}
                  onChange={(e) => handleFieldChange('waiversAndForms', e.target.value, 'covid')}
                  disabled={!isEditing}
                  placeholder="Enter COVID waiver link"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media">Media Release</Label>
                <Textarea
                  id="media"
                  value={getValue('waiversAndForms', 'media')}
                  onChange={(e) => handleFieldChange('waiversAndForms', e.target.value, 'media')}
                  disabled={!isEditing}
                  placeholder="Enter media release link"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nwMentorship">nwPlus Mentorship</Label>
                <Textarea
                  id="nwMentorship"
                  value={getValue('waiversAndForms', 'nwMentorship')}
                  onChange={(e) => handleFieldChange('waiversAndForms', e.target.value, 'nwMentorship')}
                  disabled={!isEditing}
                  placeholder="Enter nwPlus mentorship link"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseLiability">Release Liability</Label>
                <Textarea
                  id="releaseLiability"
                  value={getValue('waiversAndForms', 'releaseLiability')}
                  onChange={(e) => handleFieldChange('waiversAndForms', e.target.value, 'releaseLiability')}
                  disabled={!isEditing}
                  placeholder="Enter release liability link"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}