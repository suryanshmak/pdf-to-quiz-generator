import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudyModesProps {
  onModeSelect: (mode: string) => void;
}

export function StudyModes({ onModeSelect }: StudyModesProps) {
  const modes = [
    {
      id: "flashcards",
      title: "Flashcards",
      description: "Quick review",
      color: "green",
    },
    {
      id: "matching",
      title: "Matching",
      description: "Match terms",
      color: "orange",
    },
    {
      id: "quiz",
      title: "Quiz",
      description: "Multiple choice",
      color: "blue",
    },
    {
      id: "write",
      title: "Write",
      description: "Written answers",
      color: "purple",
    },
  ];

  return (
    <Card className="shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Study Modes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {modes.map((mode) => (
            <div
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              className={`p-4 rounded-lg bg-${mode.color}-50 dark:bg-${mode.color}-900/20 border border-${mode.color}-200 dark:border-${mode.color}-800 hover:bg-${mode.color}-100 dark:hover:bg-${mode.color}-900/30 transition-colors cursor-pointer`}
            >
              <div
                className={`text-lg font-semibold text-${mode.color}-600 dark:text-${mode.color}-400`}
              >
                {mode.title}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {mode.description}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
