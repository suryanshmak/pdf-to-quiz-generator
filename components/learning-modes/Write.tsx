"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shuffle, Loader2 } from "lucide-react";

interface WriteProps {
  terms: {
    id: string;
    term: string;
    definition: string;
  }[];
  studySetId: string;
}

export function Write({ terms, studySetId }: WriteProps) {
  const [questions, setQuestions] = useState<typeof terms>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);

  const generateQuestions = () => {
    const shuffledTerms = [...terms].sort(() => Math.random() - 0.5);
    setQuestions(shuffledTerms);
    setCurrentIndex(0);
    setAnswer("");
    setIsAnswered(false);
    setScore(0);
    setIsComplete(false);
  };

  useEffect(() => {
    generateQuestions();
  }, [terms]);

  const currentQuestion = questions[currentIndex];

  const checkAnswer = async () => {
    setIsChecking(true);
    setAiFeedback(null);
    try {
      const response = await fetch("/api/check-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAnswer: answer,
          correctAnswer: currentQuestion.definition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check answer");
      }

      const feedback = await response.json();
      setAiFeedback(feedback);

      if (feedback.isCorrect) {
        setScore((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error checking answer:", error);
      // Fallback to basic matching if AI check fails
      const isCorrect =
        answer.toLowerCase().trim() ===
        currentQuestion.definition.toLowerCase().trim();
      setAiFeedback({
        isCorrect,
        explanation: isCorrect
          ? "Answer matches exactly"
          : "Answer does not match",
      });
      if (isCorrect) {
        setScore((prev) => prev + 1);
      }
    } finally {
      setIsChecking(false);
      setIsAnswered(true);
    }
  };

  const handleNext = async () => {
    if (currentIndex === questions.length - 1) {
      setIsComplete(true);
      // Save progress when write mode is completed
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studySetId,
            mode: "write",
            score: score,
          }),
        });
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
      setAnswer("");
      setIsAnswered(false);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-4xl mx-auto p-8">
      {/* Progress bar */}
      <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 h-1.5 rounded-full overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 shadow-lg"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {!isComplete ? (
        <>
          {/* Stats */}
          <div className="w-full flex justify-between items-center px-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full font-medium">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full font-medium">
                Score: {score} / {questions.length}
              </span>
            </div>
          </div>

          {/* Question card */}
          <Card className="w-full shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
            <CardContent className="p-12">
              <h2 className="text-4xl font-semibold mb-8 text-center leading-relaxed">
                {currentQuestion.term}
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="answer">Your Answer</Label>
                  <Input
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={isAnswered}
                    placeholder="Type your answer here..."
                    className="h-14 text-lg"
                  />
                </div>

                {isAnswered && (
                  <div
                    className={`p-6 rounded-xl border ${
                      aiFeedback?.isCorrect
                        ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                        : "bg-red-50 dark:bg-red-900/20 border-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className={`text-xl font-semibold ${
                          aiFeedback?.isCorrect
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {aiFeedback?.isCorrect ? "Correct!" : "Not Quite Right"}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Your Answer
                        </div>
                        <div className="text-lg">{answer}</div>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Correct Answer
                        </div>
                        <div className="text-lg">
                          {currentQuestion.definition}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Explanation
                        </div>
                        <div className="text-base leading-relaxed">
                          {aiFeedback?.explanation
                            .toString()
                            .substring(48)
                            .replace(/[{}`]/g, "")
                            .replace(/^"|"$/g, "")
                            .trim()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isAnswered ? (
                  <Button
                    className="w-full h-14 text-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.2)] transition-shadow duration-300"
                    onClick={checkAnswer}
                    disabled={!answer.trim() || isChecking}
                  >
                    {isChecking ? (
                      <span className="flex items-center space-x-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Checking Answer...</span>
                      </span>
                    ) : (
                      "Check Answer"
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-14 text-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.2)] transition-shadow duration-300"
                    onClick={handleNext}
                  >
                    {currentIndex === questions.length - 1
                      ? "Finish"
                      : "Next Question"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="w-full shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
          <CardContent className="p-12">
            <h2 className="text-4xl font-bold text-center mb-6">
              Write Mode Complete!
            </h2>
            <p className="text-2xl text-center mb-8">
              Your score: {score} / {questions.length} (
              {Math.round((score / questions.length) * 100)}%)
            </p>
            <Button
              className="w-full h-14 text-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.2)] transition-shadow duration-300"
              onClick={generateQuestions}
              variant="outline"
            >
              <Shuffle className="h-6 w-6 mr-3" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
