import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/evaluator')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/evaluator"!</div>
}
