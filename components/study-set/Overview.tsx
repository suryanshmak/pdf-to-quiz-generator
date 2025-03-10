import { ProgressOverview } from "./ProgressOverview";
import { StudyModes } from "./StudyModes";
import { TermsList } from "./TermsList";

interface Term {
  id: string;
  term: string;
  definition: string;
  studySetId: string;
}

interface OverviewProps {
  overall: number;
  mastered: number;
  totalTerms: number;
  terms: Term[];
  onModeSelect: (mode: string) => void;
}

export function Overview({
  overall,
  mastered,
  totalTerms,
  terms,
  onModeSelect,
}: OverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ProgressOverview
        overall={overall}
        mastered={mastered}
        totalTerms={totalTerms}
      />
      <StudyModes onModeSelect={onModeSelect} />
      <TermsList terms={terms} />
    </div>
  );
}
