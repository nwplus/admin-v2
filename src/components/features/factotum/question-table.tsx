import { Checkbox } from "@/components/ui/checkbox"
import type { DiscordQuestion } from "@/lib/firebase/types"
import { useEffect, useState } from "react"
import { DiscordQuestionDialog } from "./discord-question-dialog"
import { DataTable, createTableColumnHelper } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { susbcribeToDiscordQuestions } from "@/services/discord-questions"
import { useFactotum } from "@/providers/factotum-provider"



export function QuestionTable() {
  const [activeQuestion, setActiveQuestion] = useState<DiscordQuestion | null>(null)
  const [search, setSearch] = useState<string>("");
  const [questions, setQuestions] = useState<DiscordQuestion[]>([])
  const server = useFactotum().server

  useEffect(() => {
    const unsub = () => {
      susbcribeToDiscordQuestions(setQuestions, server)
    }
    return () => {
      unsub()
    }
  }, [server])

  const columnHelper = createTableColumnHelper<DiscordQuestion>()

  const columns = [
    columnHelper.accessor("lastModified", {
      header: "Modified",
      cell: (info) => {
        const timestamp = info.getValue();
        return timestamp?.toDate().toLocaleString();
      },
    }),
    columnHelper.accessor("lastModifiedBy", {
      header: "Modified by",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("sponsor", {
      header: "Sponsor",
    }),
    columnHelper.accessor("question", {
      header: "Question",
    }),
    columnHelper.accessor("answer", {
      header: "Answer",
    }),
    columnHelper.accessor("needAllAnswers", {
      header: "All Answers Required?",
      cell: ({ row }) => <Checkbox defaultChecked={row.original.needAllAnswers} />,
    }),
  ]

  return (
    <Card className="w-fullrounded-xl">
      <CardContent>
        <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="mb-5"
              />
        <DataTable
          columns={columns}
          data={questions}
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          onRowClick={(data) => setActiveQuestion(questions?.find((q) => q.id === data.id) ?? null)}
          globalFilter={search}
          setGlobalFilter={setSearch}
        />

    
          <DiscordQuestionDialog
            open = {!!activeQuestion}
            onClose = {() => setActiveQuestion(null)}
            activeQuestion={activeQuestion}
          />
      
      </CardContent>
    </Card>
  )
}
  