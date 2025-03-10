import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function POST(req: Request) {
  try {
    const { userAnswer, correctAnswer } = await req.json();

    const prompt = `You are a teacher evaluating student answers. Compare the following student answer to the correct answer and determine if they are semantically equivalent or if the student's answer demonstrates understanding of the concept. Reply by not saying student but you.

Correct Answer: "${correctAnswer}"
Student Answer: "${userAnswer}"

Analyze both answers and respond in the following JSON format:
{
  "isCorrect": true/false,
  "explanation": "Brief explanation of why the answer is correct or incorrect"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const parsedResponse = JSON.parse(text);
      return NextResponse.json(parsedResponse);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      // Fallback to basic text parsing if JSON parsing fails
      const isCorrect = text.toLowerCase().includes("true");
      return NextResponse.json({
        isCorrect,
        explanation: text,
      });
    }
  } catch (error) {
    console.error("[CHECK_ANSWER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
