import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/livesites/$siteId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/livesites/$siteId"!</div>
}
