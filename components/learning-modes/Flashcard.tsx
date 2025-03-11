"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Repeat, Sparkles } from "lucide-react";

interface FlashcardProps {
  terms: {
    id: string;
    term: string;
    definition: string;
  }[];
  studySetId: string;
  onProgressChange?: () => void;
}

export function Flashcard({
  terms,
  studySetId,
  onProgressChange,
}: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [masteredIndices, setMasteredIndices] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);

  const currentTerm = terms[currentIndex];

  // Load initial mastered state from progress data
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch(
          `/api/progress?studySetId=${studySetId}&mode=flashcard`
        );
        if (!response.ok) throw new Error("Failed to fetch progress");

        const progressData = await response.json();
        if (progressData.length > 0) {
          // Get the most recent progress entry
          const latestProgress = progressData[0];
          // Calculate how many terms were mastered based on the score
          const masteredCount = Math.floor(latestProgress.score);
          // Create a set of mastered indices
          const masteredSet = new Set(
            Array.from({ length: masteredCount }, (_, i) => i)
          );
          setMasteredIndices(masteredSet);
        }
      } catch (error) {
        console.error("Error loading progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [studySetId]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % terms.length);
    setIsFlipped(false);
  }, [terms.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + terms.length) % terms.length);
    setIsFlipped(false);
  }, [terms.length]);

  const handleShuffle = useCallback(() => {
    const shuffledTerms = [...terms].sort(() => Math.random() - 0.5);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffled(!shuffled);
  }, [terms, shuffled]);

  const toggleMastered = useCallback(async () => {
    const newMasteredIndices = new Set(masteredIndices);
    if (newMasteredIndices.has(currentIndex)) {
      newMasteredIndices.delete(currentIndex);
    } else {
      newMasteredIndices.add(currentIndex);
    }
    setMasteredIndices(newMasteredIndices);

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studySetId,
          mode: "flashcard",
          score: newMasteredIndices.size,
        }),
      });
      onProgressChange?.();
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [currentIndex, masteredIndices, studySetId, onProgressChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault(); // Prevent page scroll
          setIsFlipped(!isFlipped);
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "m":
        case "M":
          toggleMastered();
          break;
        case "s":
        case "S":
          handleShuffle();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentIndex,
    isFlipped,
    masteredIndices,
    shuffled,
    handleNext,
    handlePrevious,
    toggleMastered,
    handleShuffle,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-10 w-full max-w-4xl mx-auto p-8">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading flashcards...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-4xl mx-auto p-8">
      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 shadow-lg"
          style={{ width: `${((currentIndex + 1) / terms.length) * 100}%` }}
        />
      </div>

      {/* Stats */}
      <div className="w-full flex justify-between items-center px-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full font-medium">
            Card {currentIndex + 1} of {terms.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full font-medium">
            {masteredIndices.size} mastered
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full aspect-[3/2] relative perspective-1000 px-4">
        <Card
          className={`w-full h-full cursor-pointer transition-all duration-500 transform-gpu 
            ${
              isFlipped
                ? "shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                : "shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]"
            }
            hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]
          `}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <CardContent
            className="absolute w-full h-full flex flex-col items-center justify-center p-12 backface-hidden bg-white dark:bg-zinc-900 rounded-xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute top-6 left-6 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">
              Term
            </div>
            <h2 className="text-4xl font-semibold text-center leading-relaxed max-w-2xl">
              {currentTerm.term}
            </h2>
            <div className="absolute bottom-6 text-sm text-muted-foreground flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                Space
              </span>
              <span>to flip</span>
            </div>
          </CardContent>
          <CardContent
            className="absolute w-full h-full flex flex-col items-center justify-center p-12 backface-hidden bg-white dark:bg-zinc-900 rounded-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="absolute top-6 left-6 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">
              Definition
            </div>
            <p className="text-2xl text-center leading-relaxed max-w-2xl">
              {currentTerm.definition}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 p-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="w-14 h-14 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-300"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleShuffle}
          className="w-14 h-14 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-300"
        >
          <Repeat className="h-6 w-6" />
        </Button>
        <Button
          variant={masteredIndices.has(currentIndex) ? "default" : "outline"}
          size="lg"
          onClick={toggleMastered}
          className="w-14 h-14 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-300"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleNext}
          disabled={currentIndex === terms.length - 1}
          className="w-14 h-14 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-300"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Keyboard shortcuts */}
      <div className="flex gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
            ←
          </span>
          <span>Previous</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
            →
          </span>
          <span>Next</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
            Space
          </span>
          <span>Flip</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
            M
          </span>
          <span>Master</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
            S
          </span>
          <span>Shuffle</span>
        </div>
      </div>
    </div>
  );
}
