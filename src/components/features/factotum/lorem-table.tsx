import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash } from "lucide-react"
import type { DiscordQuestion } from "@/lib/firebase/types"
import { Timestamp } from "firebase/firestore"
import { useState } from "react"
import { DiscordQuestionDialog } from "./discord-question-dialog"
import { DataTable, createTableColumnHelper } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
const questions: DiscordQuestion[] = [
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "Jeff Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "John Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
  {
    id: "1",
    sponsor: "Amazon",
    question: "What is the name of Amazon's founder?",
    answer: "df Bezos",
    required: false,
    updatedAt: Timestamp.now(),
    updatedBy: "MC Doe",
  },
]

export function TableDemo() {
  const [selectedQuestions, setSelectedQuestions] = useState<DiscordQuestion | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState<string>("");

  const columnHelper = createTableColumnHelper<DiscordQuestion>()

  const columns = [
    columnHelper.accessor("sponsor", {
      header: "Sponsor",
    }),
    columnHelper.accessor("question", {
      header: "Question",
    }),
    columnHelper.accessor("answer", {
      header: "Answer",
    }),
    columnHelper.accessor("required", {
      header: "All Answers Required?",
      cell: ({ row }) => <Checkbox defaultChecked={row.original.required} />,
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="space-x-2 flex gap-2">
          <Edit 
            className="w-5  cursor-pointer text-theme"
            onClick={() => {
              setSelectedQuestions(row.original)
              setIsOpen(true)
            }}
          />
          <Trash className="w-5 cursor-pointer text-red-500" />
        </div>
      ),
    }),
  ]

  return (
    <div className="p-5 border-2 border-gray-300 rounded-xl">
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
        globalFilter={search}
        setGlobalFilter={setSearch}
      />

      {selectedQuestions && (
        <DiscordQuestionDialog
          question={selectedQuestions}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      )}
    </div>
  )
}
  