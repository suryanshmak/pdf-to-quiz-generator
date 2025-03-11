"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Shuffle, Keyboard } from "lucide-react";

interface QuizProps {
  terms: {
    id: string;
    term: string;
    definition: string;
  }[];
  studySetId: string;
}

interface Question {
  id: string;
  term: string;
  correctAnswer: string;
  options: string[];
}

export function Quiz({ terms, studySetId }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const generateQuestions = useCallback(() => {
    const shuffledTerms = [...terms].sort(() => Math.random() - 0.5);
    const generatedQuestions = shuffledTerms.map((term) => {
      const wrongAnswers = terms
        .filter((t) => t.id !== term.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((t) => t.definition);

      const options = [...wrongAnswers, term.definition].sort(
        () => Math.random() - 0.5
      );

      return {
        id: term.id,
        term: term.term,
        correctAnswer: term.definition,
        options,
      };
    });

    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswered(false);
    setScore(0);
    setIsComplete(false);
    localStorage.removeItem("quizProgress"); // Clear saved progress when starting new quiz
  }, [terms]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = useCallback(
    (selectedAnswer: string) => {
      setSelectedAnswer(selectedAnswer);
      setIsAnswered(true);
      if (selectedAnswer === currentQuestion?.correctAnswer) {
        setScore((prev) => prev + 1);
      }
    },
    [currentQuestion?.correctAnswer]
  );

  const handleNext = useCallback(async () => {
    if (currentQuestionIndex === questions.length - 1) {
      setIsComplete(true);
      // Save progress when quiz is completed
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studySetId,
            mode: "quiz",
            score: score,
          }),
        });
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer("");
      setIsAnswered(false);
    }
  }, [currentQuestionIndex, questions.length, score, studySetId]);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem("quizProgress");
    if (savedProgress) {
      const {
        questions: savedQuestions,
        currentIndex,
        savedScore,
        answered,
      } = JSON.parse(savedProgress);

      // Only restore progress if it's for the same set of terms
      if (
        savedQuestions.length === terms.length &&
        savedQuestions[0].id === terms[0].id
      ) {
        setQuestions(savedQuestions);
        setCurrentQuestionIndex(currentIndex);
        setScore(savedScore);
        setIsAnswered(answered);
      } else {
        generateQuestions();
      }
    } else {
      generateQuestions();
    }
  }, [terms, generateQuestions]);

  // Save progress to localStorage
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(
        "quizProgress",
        JSON.stringify({
          questions,
          currentIndex: currentQuestionIndex,
          savedScore: score,
          answered: isAnswered,
        })
      );
    }
  }, [questions, currentQuestionIndex, score, isAnswered]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in an input or if target is not the document body
      if (e.target instanceof HTMLInputElement || e.target !== document.body) {
        return;
      }

      // Prevent default behavior for these keys
      if (["1", "2", "3", "4", "Enter", "?"].includes(e.key)) {
        e.preventDefault();
      }

      if (!currentQuestion) return;

      switch (e.key) {
        case "1":
        case "2":
        case "3":
        case "4":
          if (!isAnswered) {
            const index = parseInt(e.key) - 1;
            if (index < currentQuestion.options.length) {
              setSelectedAnswer(currentQuestion.options[index]);
            }
          }
          break;
        case "Enter":
          if (!isAnswered && selectedAnswer) {
            handleAnswer(selectedAnswer);
          } else if (isAnswered) {
            handleNext();
          }
          break;
        case "?":
          setShowKeyboardShortcuts((prev) => !prev);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isAnswered, selectedAnswer, currentQuestion, handleAnswer, handleNext]);

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-4xl mx-auto p-8">
      {showKeyboardShortcuts && (
        <Card className="w-full mb-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  1-4
                </kbd>
                <span className="ml-2">Select answer</span>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  Enter
                </kbd>
                <span className="ml-2">Check answer / Next question</span>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  ?
                </kbd>
                <span className="ml-2">Toggle shortcuts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 h-1.5 rounded-full overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 shadow-lg"
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {!isComplete ? (
        <>
          {/* Stats */}
          <div className="w-full flex justify-between items-center px-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
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
              <RadioGroup
                value={selectedAnswer}
                onValueChange={setSelectedAnswer}
                className="space-y-6"
              >
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-4 p-6 rounded-xl border transition-all duration-300 ${
                      isAnswered
                        ? option === currentQuestion.correctAnswer
                          ? "bg-green-50 dark:bg-green-900/20 border-green-500 shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]"
                          : option === selectedAnswer
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

              {!isAnswered ? (
                <Button
                  className="w-full mt-8 h-14 text-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.2)] transition-shadow duration-300"
                  onClick={() => handleAnswer(selectedAnswer)}
                  disabled={!selectedAnswer}
                >
                  Check Answer
                </Button>
              ) : (
                <Button
                  className="w-full mt-8 h-14 text-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.2)] transition-shadow duration-300"
                  onClick={handleNext}
                >
                  {currentQuestionIndex === questions.length - 1
                    ? "Finish Quiz"
                    : "Next Question"}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="w-full shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
          <CardContent className="p-12">
            <h2 className="text-4xl font-bold text-center mb-6">
              Quiz Complete!
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

      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4"
        onClick={() => setShowKeyboardShortcuts(true)}
      >
        <Keyboard className="h-4 w-4 mr-2" />
        Shortcuts
      </Button>
    </div>
  );
}
