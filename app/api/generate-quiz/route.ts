import { questionsSchema } from "@/lib/schemas";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const prisma = new PrismaClient();

export const maxDuration = 60;

function parseQuizResponse(text: string) {
  const questions = [];
  const lines = text.split("\n");
  let currentQuestion: any = null;

  for (const line of lines) {
    // Match question lines (starting with number and possibly wrapped in **)
    const questionMatch = line.match(/^\d+\.\s*\*?\*?(.*?)\*?\*?$/);
    if (questionMatch) {
      if (currentQuestion && currentQuestion.options.length === 4) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        question: questionMatch[1].trim(),
        options: [],
        answer: null,
      };
      continue;
    }

    // Match option lines (starting with either (a) or a) format)
    if (currentQuestion && line.match(/^\s*(?:\()?[a-d]\)?[\s\)]+/i)) {
      const option = line
        .replace(/^\s*(?:\()?[a-d]\)?[\s\)]+/i, "")
        .replace(/✓$/, "") // Remove any existing tick marks
        .trim();

      if (option && currentQuestion.options.length < 4) {
        // Remove [CORRECT] prefix and set as answer
        if (option.startsWith("[CORRECT]")) {
          const cleanOption = option.replace("[CORRECT]", "").trim();
          currentQuestion.options.push(cleanOption);
          // Extract the option letter
          const optionLetter = line.match(/[a-d]/i)?.[0]?.toUpperCase();
          if (optionLetter) {
            currentQuestion.answer = optionLetter;
          }
        } else {
          currentQuestion.options.push(option);
        }
      }
    }
  }

  // Add the last question if it has 4 options
  if (currentQuestion && currentQuestion.options.length === 4) {
    questions.push(currentQuestion);
  }

  // Ensure each question has an answer
  questions.forEach((q) => {
    if (!q.answer) {
      q.answer = "B"; // Default to B if we couldn't detect the answer
    }
  });

  // Log for debugging
  console.log("Parsed questions:", JSON.stringify(questions, null, 2));

  return questions;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request body received");

    const files = JSON.parse(body.prompt);
    console.log("Files parsed:", files.length);

    const firstFile = files[0].data;
    console.log("First file data length:", firstFile.length);

    try {
      console.log("Calling AI model...");
      const result = await model.generateContent([
        {
          text: "You are a teacher. Your job is to take a document, and create a multiple choice test based on the content of the document. Each option should be roughly equal in length. Make sure to include a mix of easy, medium, and hard questions.",
        },
        {
          text: "Create a multiple choice test with how many ever questions you can based on this document. After each question and its options, write '---' on a new line.",
        },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: firstFile.split(",")[1] || firstFile,
          },
        },
      ]);

      console.log("AI model response received");
      const response = await result.response;
      const responseText = response.text();
      console.log("AI Response:", responseText);

      // Split response into individual questions
      const questionBlocks = responseText.split("---").filter(Boolean);
      const totalQuestions = questionBlocks.length;

      // Parse questions one by one
      const questions = [];
      for (const block of questionBlocks) {
        const parsedQuestion = parseQuizResponse(block)[0];
        if (parsedQuestion) {
          questions.push(parsedQuestion);
        }
      }

      console.log("Questions parsed successfully");
      const validatedQuestions = questionsSchema.parse(questions);

      console.log("Creating study set...");
      const studySet = await prisma.studySet.create({
        data: {
          title: files[0].name,
          terms: {
            create: validatedQuestions.map((question) => ({
              term: question.question,
              definition:
                question.options[
                  question.answer === "A"
                    ? 0
                    : question.answer === "B"
                    ? 1
                    : question.answer === "C"
                    ? 2
                    : 3
                ],
            })),
          },
        },
        include: {
          terms: true,
        },
      });

      console.log("Study set created:", studySet.id);

      return Response.json({
        questions: validatedQuestions,
        studySetId: studySet.id,
        totalQuestions,
      });
    } catch (error) {
      console.error("Error in AI or database operation:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return new Response(
        JSON.stringify({
          error: "Failed to generate quiz or save to database",
          details: error instanceof Error ? error.message : String(error),
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error parsing request:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return new Response(
      JSON.stringify({
        error: "Failed to parse request data",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 400 }
    );
  }
}

// Remove the GET endpoint since we're now returning the ID with the questions
export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
