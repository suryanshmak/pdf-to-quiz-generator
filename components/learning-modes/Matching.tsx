"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

interface MatchingProps {
  terms: {
    id: string;
    term: string;
    definition: string;
  }[];
}

interface MatchingCard {
  id: string;
  content: string;
  type: "term" | "definition";
  isMatched: boolean;
  isFlipped: boolean;
  originalId: string;
}

export function Matching({ terms }: MatchingProps) {
  const [cards, setCards] = useState<MatchingCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchingCard[]>([]);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const initializeCards = () => {
    const shuffledCards = [
      ...terms.map((term) => ({
        id: term.id + "-term",
        content: term.term,
        type: "term" as const,
        isMatched: false,
        isFlipped: false,
        originalId: term.id,
      })),
      ...terms.map((term) => ({
        id: term.id + "-def",
        content: term.definition,
        type: "definition" as const,
        isMatched: false,
        isFlipped: false,
        originalId: term.id,
      })),
    ].sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setSelectedCards([]);
    setMatches(0);
    setIsChecking(false);
  };

  useEffect(() => {
    initializeCards();
  }, []);

  useEffect(() => {
    if (selectedCards.length === 2 && !isChecking) {
      setIsChecking(true);
      const [first, second] = selectedCards;
      const isMatch =
        first.originalId === second.originalId && first.type !== second.type;

      setTimeout(() => {
        if (isMatch) {
          setCards((prev) =>
            prev.map((card) =>
              selectedCards.some((selected) => selected.id === card.id)
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatches((prev) => prev + 1);
        } else {
          setCards((prev) =>
            prev.map((card) =>
              selectedCards.some((selected) => selected.id === card.id)
                ? { ...card, isFlipped: false }
                : card
            )
          );
        }
        setSelectedCards([]);
        setIsChecking(false);
      }, 1000);
    }
  }, [selectedCards, isChecking]);

  const handleCardClick = (card: MatchingCard) => {
    if (
      card.isMatched ||
      card.isFlipped ||
      isChecking ||
      selectedCards.length === 2 ||
      selectedCards.some((selected) => selected.id === card.id)
    ) {
      return;
    }

    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c))
    );
    setSelectedCards((prev) => [...prev, card]);
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-4xl mx-auto p-8">
      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 shadow-lg"
          style={{ width: `${(matches / terms.length) * 100}%` }}
        />
      </div>

      {/* Stats */}
      <div className="w-full flex justify-between items-center px-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full font-medium">
            Matches: {matches} / {terms.length}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={initializeCards}
          className="h-10 px-4 rounded-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.2)] transition-shadow duration-300"
        >
          <Shuffle className="h-4 w-4 mr-2" />
          Restart
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {cards.map((card) => (
          <Card
            key={card.id}
            className={`relative aspect-[4/3] cursor-pointer transition-all duration-300 ${
              card.isMatched
                ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                : card.isFlipped
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                : "bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
            }`}
            onClick={() => handleCardClick(card)}
          >
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <p
                className={`text-base font-medium leading-relaxed text-center ${
                  card.isMatched
                    ? "text-green-700 dark:text-green-300"
                    : card.isFlipped
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-foreground"
                }`}
              >
                {card.content}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {matches === terms.length && (
        <Card className="w-full mt-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
          <div className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Congratulations!
            </h2>
            <p className="text-2xl">You've matched all the terms!</p>
            <Button
              className="mt-8 h-14 text-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.2)] transition-shadow duration-300"
              onClick={initializeCards}
              variant="outline"
            >
              <Shuffle className="h-6 w-6 mr-3" />
              Play Again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
