import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  
  const questions = [
    {
        id: 1,
      Sponsor: "Amazon",
      Question: "What is the name of Amazon's founder?",
      Answer: "Jeff Bezos",
      Required: false,
    },
    {
        id: 2,
      Sponsor: "Google",
      Question: "What is the name of Google's founder?",
      Answer: "Larry Page",
      Required: false,
    },
    {
        id: 3,
      Sponsor: "Apple",
      Question: "What is the name of Apple's founder?",
      Answer: "Steve Jobs",
      Required: true,
    },
    {
        id: 4,
      Sponsor: "Microsoft",
      Question: "What is the name of Microsoft's founder?",
      Answer: "Bill Gates",
      Required: false,
    },
    {
        id: 4,
      Sponsor: "Microsoft",
      Question: "What is the name of Microsoft's founder?",
      Answer: "Bill Gates",
      Required: false,
    },
    {
        id: 4,
      Sponsor: "Microsoft",
      Question: "What is the name of Microsoft's founder?",
      Answer: "Bill Gates",
      Required: false,
    },
    {
        id: 4,
      Sponsor: "Microsoft",
      Question: "What is the name of Microsoft's founder?",
      Answer: "Bill Gates",
      Required: false,
    },
    {
        id: 4,
      Sponsor: "Microsoft",
      Question: "What is the name of Microsoft's founder?",
      Answer: "Bill Gates",
      Required: false,
    },

    

    
  ]
  
  export function TableDemo() {
    return (
        <div className="p-5 border-2 border-gray-300 rounded-md">
        <div className="h-[300px] overflow-y-auto">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="text-black font-bold">Sponsor</TableHead>
                <TableHead className="text-black font-bold">Question</TableHead>
                <TableHead className="text-black font-bold">Answer</TableHead>
                <TableHead className="text-black font-bold">All Answers Required?</TableHead>
                <TableHead className="text-black font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
  
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.Sponsor}</TableCell>
                  <TableCell>{q.Question}</TableCell>
                  <TableCell>{q.Answer}</TableCell>
                  <TableCell>
                    <Checkbox defaultChecked={q.Required} />
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm">Edit</Button>
                    <Button size="sm" variant="destructive">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }
  