import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const studySets = await prisma.studySet.findMany({
      include: {
        terms: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(studySets);
  } catch (error) {
    console.error("[STUDY_SETS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
