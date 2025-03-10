import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Term {
  id: string;
  term: string;
  definition: string;
  studySetId: string;
}

interface TermsListProps {
  terms: Term[];
}

export function TermsList({ terms }: TermsListProps) {
  return (
    <Card className="md:col-span-2 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terms.map((term) => (
            <div
              key={term.id}
              className="p-4 rounded-lg bg-white dark:bg-zinc-900 border hover:shadow-md dark:hover:shadow-zinc-800/50 transition-all duration-300"
            >
              <div className="font-medium text-lg mb-2">{term.term}</div>
              <div className="text-muted-foreground">{term.definition}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
