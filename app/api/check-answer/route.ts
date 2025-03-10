import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function POST(req: Request) {
  try {
    const { userAnswer, correctAnswer } = await req.json();

    const prompt = `You are a teacher evaluating student answers. Your task is to determine if the following two answers convey the same meaning or information, even if worded differently. Be strict in your evaluation - the answers must convey the exact same concept.

Correct Answer: "${correctAnswer}"
Your Answer: "${userAnswer}"

Consider:
1. Do both answers convey the exact same information?
2. Are there any key differences in meaning?
3. Would both answers be considered functionally equivalent in an educational context?

Respond in the following JSON format:
{
  "isCorrect": true/false,
  "explanation": "Brief explanation why the answer is correct or incorrect"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean the response text by removing markdown code blocks and any extra whitespace
      const cleanedText = text
        .replace(/```json\n?|\n?```/g, "") // Remove markdown code blocks
        .trim();
      const parsedResponse = JSON.parse(cleanedText);
      return NextResponse.json(parsedResponse);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      // Fallback to basic string comparison if JSON parsing fails
      const isCorrect =
        userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      return NextResponse.json({
        isCorrect,
        explanation: isCorrect
          ? "Exact match"
          : "The answer does not match exactly",
      });
    }
  } catch (error) {
    console.error("[CHECK_ANSWER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
