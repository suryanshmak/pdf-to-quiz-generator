import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { studySetId, mode, score } = await req.json();

    const progress = await prisma.progress.create({
      data: {
        userId: "anonymous", // Default anonymous user
        studySetId,
        mode,
        score,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[PROGRESS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studySetId = searchParams.get("studySetId");
    const mode = searchParams.get("mode");

    const progress = await prisma.progress.findMany({
      where: {
        userId: "anonymous", // Default anonymous user
        studySetId: studySetId || undefined,
        mode: mode || undefined,
      },
      include: {
        studySet: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[PROGRESS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
