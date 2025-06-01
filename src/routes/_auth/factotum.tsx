import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/factotum')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/factotum"!</div>
}
