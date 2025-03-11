import { questionsSchema } from "@/lib/schemas";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export const maxDuration = 60; // Maximum allowed duration for Vercel hobby plan

// Maximum PDF size in bytes (4MB)
const MAX_PDF_SIZE = 4 * 1024 * 1024;

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
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Missing Google AI API key");
    }

    const contentLength = parseInt(
      req.headers.get("content-length") || "0",
      10
    );
    if (contentLength > MAX_PDF_SIZE) {
      return new Response(
        JSON.stringify({
          error: "PDF file too large",
          details: "Maximum file size is 4MB",
        }),
        { status: 400 }
      );
    }

    const body = await req.json();
    if (!body.prompt) {
      return new Response(
        JSON.stringify({
          error: "Missing prompt in request body",
        }),
        { status: 400 }
      );
    }

    const files = JSON.parse(body.prompt);
    if (!files || !files.length) {
      return new Response(
        JSON.stringify({
          error: "No files provided",
        }),
        { status: 400 }
      );
    }

    const firstFile = files[0].data;
    if (!firstFile) {
      return new Response(
        JSON.stringify({
          error: "Invalid file data",
        }),
        { status: 400 }
      );
    }

    // Extract base64 PDF data
    const pdfData = firstFile.includes("base64,")
      ? firstFile.split("base64,")[1]
      : firstFile;

    if (!pdfData) {
      return new Response(
        JSON.stringify({
          error: "Invalid PDF data format",
        }),
        { status: 400 }
      );
    }

    try {
      // Validate PDF data size after base64 decoding
      const decodedLength = Buffer.from(pdfData, "base64").length;
      if (decodedLength > MAX_PDF_SIZE) {
        return new Response(
          JSON.stringify({
            error: "Decoded PDF file too large",
            details: "Maximum file size is 4MB",
          }),
          { status: 400 }
        );
      }

      const result = await model.generateContent([
        {
          text: "You are a teacher. Your job is to take a document, and create a multiple choice test based on the content of the document. Each option should be roughly equal in length. Make sure to include a mix of easy, medium, and hard questions. Mark the correct answer with [CORRECT] at the start of the option.",
        },
        {
          text: "Create a multiple choice test with 5 questions based on this document. Format each question as:\n1. Question\na) Option\nb) Option\nc) Option\nd) Option\n---",
        },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfData,
          },
        },
      ]);

      if (!result.response) {
        throw new Error("No response from AI model");
      }

      const responseText = result.response.text();
      if (!responseText) {
        throw new Error("Empty response from AI model");
      }

      const questionBlocks = responseText.split("---").filter(Boolean);
      if (!questionBlocks.length) {
        throw new Error(
          "No questions generated from response: " +
            responseText.substring(0, 100)
        );
      }

      const questions = [];
      for (const block of questionBlocks) {
        try {
          const parsedQuestion = parseQuizResponse(block)[0];
          if (
            parsedQuestion &&
            parsedQuestion.question &&
            parsedQuestion.options.length === 4 &&
            parsedQuestion.answer
          ) {
            questions.push(parsedQuestion);
          }
        } catch (parseError) {
          console.error("Error parsing question block:", block);
          console.error("Parse error:", parseError);
        }
      }

      if (!questions.length) {
        throw new Error("Failed to parse any valid questions from response");
      }

      const validatedQuestions = questionsSchema.parse(questions);

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

      return Response.json({
        questions: validatedQuestions,
        studySetId: studySet.id,
        totalQuestions: validatedQuestions.length,
      });
    } catch (error) {
      console.error("Detailed error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
      });

      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes("prisma")) {
          return new Response(
            JSON.stringify({
              error: "Database error",
              details: "Failed to save quiz to database",
            }),
            { status: 500 }
          );
        }
        if (error.message.includes("AI")) {
          return new Response(
            JSON.stringify({
              error: "AI model error",
              details: "Failed to generate questions",
            }),
            { status: 500 }
          );
        }
      }

      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Failed to generate quiz",
          details: error instanceof Error ? error.stack : String(error),
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request parsing error:", error);
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
