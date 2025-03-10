import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressOverviewProps {
  overall: number;
  mastered: number;
  totalTerms: number;
}

export function ProgressOverview({
  overall,
  mastered,
  totalTerms,
}: ProgressOverviewProps) {
  return (
    <Card className="shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Study Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Overall Progress
            </span>
            <span className="text-sm font-medium">{overall}%</span>
          </div>
          <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 h-2 rounded-full overflow-hidden">
            <Progress value={overall} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {mastered}
            </div>
            <div className="text-sm text-muted-foreground">Terms Mastered</div>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalTerms}
            </div>
            <div className="text-sm text-muted-foreground">Total Terms</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
