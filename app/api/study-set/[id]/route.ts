import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").pop();

  try {
    const studySet = await prisma.studySet.findUnique({
      where: { id },
      include: { terms: true },
    });

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(studySet);
  } catch (error) {
    console.error("Error fetching study set:", error);
    return NextResponse.json(
      { error: "Error fetching study set" },
      { status: 500 }
    );
  }
}
