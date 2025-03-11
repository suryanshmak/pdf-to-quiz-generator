"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shuffle, Loader2 } from "lucide-react";

interface TestProps {
  terms: {
    id: string;
    term: string;
    definition: string;
  }[];
  studySetId: string;
}

type QuestionType = "multiple-choice" | "write" | "true-false";

interface Question {
  id: string;
  type: QuestionType;
  term: string;
  correctAnswer: string;
  options?: string[];
}

export function Test({ terms, studySetId }: TestProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
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

  const generateQuestions = useCallback(() => {
    const shuffledTerms = [...terms].sort(() => Math.random() - 0.5);
    const generatedQuestions: Question[] = shuffledTerms.map((term, index) => {
      // Alternate between question types
      const questionType: QuestionType =
        index % 3 === 0
          ? "multiple-choice"
          : index % 3 === 1
          ? "write"
          : "true-false";

      const baseQuestion = {
        id: term.id,
        term: term.term,
        correctAnswer: term.definition,
        type: questionType,
      };

      if (questionType === "multiple-choice") {
        const wrongAnswers = terms
          .filter((t) => t.id !== term.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((t) => t.definition);

        return {
          ...baseQuestion,
          options: [...wrongAnswers, term.definition].sort(
            () => Math.random() - 0.5
          ),
        };
      } else if (questionType === "true-false") {
        const isTrue = Math.random() < 0.5;
        const wrongAnswer = terms
          .filter((t) => t.id !== term.id)
          .sort(() => Math.random() - 0.5)[0].definition;

        return {
          ...baseQuestion,
          term: `Is this the correct definition for "${term.term}":\n${
            isTrue ? term.definition : wrongAnswer
          }`,
          correctAnswer: isTrue ? "True" : "False",
          options: ["True", "False"],
        };
      }

      return baseQuestion;
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setAnswer("");
    setIsAnswered(false);
    setScore(0);
    setIsComplete(false);
  }, [terms]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  const currentQuestion = questions[currentIndex];

  const checkAnswer = async () => {
    if (!currentQuestion) return;

    if (currentQuestion.type === "write") {
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
            correctAnswer: currentQuestion.correctAnswer,
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
          currentQuestion.correctAnswer.toLowerCase().trim();
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
    } else {
      // For multiple choice and true/false questions, use exact matching
      const isCorrect = answer === currentQuestion.correctAnswer;
      setAiFeedback({
        isCorrect,
        explanation: isCorrect
          ? "Correct answer selected"
          : "Incorrect answer selected",
      });
      if (isCorrect) {
        setScore((prev) => prev + 1);
      }
      setIsAnswered(true);
    }
  };

  const handleNext = async () => {
    if (currentIndex === questions.length - 1) {
      setIsComplete(true);
      // Save progress when test mode is completed
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studySetId,
            mode: "test",
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
              <div className="mb-8">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {currentQuestion.type === "multiple-choice"
                    ? "Multiple Choice"
                    : currentQuestion.type === "write"
                    ? "Written Answer"
                    : "True or False"}
                </div>
                <h2 className="text-4xl font-semibold text-center leading-relaxed">
                  {currentQuestion.term}
                </h2>
              </div>

              <div className="space-y-6">
                {currentQuestion.type === "write" ? (
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
                ) : (
                  <RadioGroup
                    value={answer}
                    onValueChange={setAnswer}
                    className="space-y-6"
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-4 p-6 rounded-xl border transition-all duration-300 ${
                          isAnswered
                            ? option === currentQuestion.correctAnswer
                              ? "bg-green-50 dark:bg-green-900/20 border-green-500 shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]"
                              : option === answer
                              ? "bg-red-50 dark:bg-red-900/20 border-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]"
                              : "bg-white dark:bg-zinc-900"
                            : "hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.5)]"
                        }`}
                      >
                        <RadioGroupItem
                          value={option}
                          id={`option-${index}`}
                          disabled={isAnswered}
                          className="w-6 h-6"
                        />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer text-lg"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {isAnswered && currentQuestion.type === "write" && (
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
                          {currentQuestion.correctAnswer}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Explanation
                        </div>
                        <div className="text-base leading-relaxed">
                          {aiFeedback?.explanation
                            .toString()
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
              Test Complete!
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
