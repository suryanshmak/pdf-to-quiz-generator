"use client";

import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flashcard } from "@/components/learning-modes/Flashcard";
import { Matching } from "@/components/learning-modes/Matching";
import { Quiz } from "@/components/learning-modes/Quiz";
import { useEffect, useState } from "react";
import { use } from "react";
import { Write } from "@/components/learning-modes/Write";
import { Test } from "@/components/learning-modes/Test";
import { Overview } from "@/components/study-set/Overview";

interface StudySetPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface StudySetWithTerms {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  terms: {
    id: string;
    term: string;
    definition: string;
    studySetId: string;
  }[];
}

interface Progress {
  id: string;
  userId: string;
  studySetId: string;
  mode: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function StudySetPage({ params }: StudySetPageProps) {
  const { id } = use(params);
  const [studySet, setStudySet] = useState<StudySetWithTerms | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchProgress = async () => {
    try {
      const progressResponse = await fetch(`/api/progress?studySetId=${id}`);
      if (!progressResponse.ok) {
        throw new Error("Failed to fetch progress");
      }
      const progressData = await progressResponse.json();
      setProgress(progressData);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studySetResponse] = await Promise.all([
          fetch(`/api/study-set/${id}`),
        ]);

        if (!studySetResponse.ok) {
          if (studySetResponse.status === 404) {
            notFound();
          }
          throw new Error("Failed to fetch study set");
        }

        const studySetData = await studySetResponse.json();
        setStudySet(studySetData);
        await fetchProgress();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleProgressChange = () => {
    fetchProgress();
  };

  const calculateProgress = () => {
    if (!studySet || progress.length === 0) return { overall: 0, mastered: 0 };

    // Calculate average score across all modes
    const totalScore = progress.reduce((acc, p) => acc + p.score, 0);
    const maxPossibleScore = studySet.terms.length * progress.length;
    const overallProgress = Math.round((totalScore / maxPossibleScore) * 100);

    // Consider a term mastered if it's been correctly answered in at least one mode
    const masteredTerms = new Set<string>();
    progress.forEach((p) => {
      const scorePerTerm = p.score / studySet.terms.length;
      if (scorePerTerm >= 0.8) {
        // 80% threshold for mastery
        studySet.terms.forEach((term) => masteredTerms.add(term.id));
      }
    });

    return {
      overall: overallProgress,
      mastered: masteredTerms.size,
    };
  };

  const { overall, mastered } = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-transparent to-gray-50 dark:to-zinc-900/50">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading study set...
        </div>
      </div>
    );
  }

  if (!studySet) {
    return notFound();
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-transparent to-gray-50 dark:to-zinc-900/50">
      <div className="container py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">{studySet?.title}</h1>
              <p className="text-muted-foreground mt-2">
                {studySet?.description}
              </p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
              <TabsTrigger value="matching">Matching</TabsTrigger>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Overview
                overall={overall}
                mastered={mastered}
                totalTerms={studySet.terms.length}
                terms={studySet.terms}
                onModeSelect={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="flashcards" className="mt-6">
              {studySet && (
                <Flashcard
                  terms={studySet.terms}
                  studySetId={studySet.id}
                  onProgressChange={handleProgressChange}
                />
              )}
            </TabsContent>

            <TabsContent value="matching" className="mt-6">
              {studySet && <Matching terms={studySet.terms} />}
            </TabsContent>

            <TabsContent value="quiz" className="mt-6">
              {studySet && (
                <Quiz terms={studySet.terms} studySetId={studySet.id} />
              )}
            </TabsContent>

            <TabsContent value="write" className="mt-6">
              {studySet && (
                <Write terms={studySet.terms} studySetId={studySet.id} />
              )}
            </TabsContent>

            <TabsContent value="test" className="mt-6">
              {studySet && (
                <Test terms={studySet.terms} studySetId={studySet.id} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
