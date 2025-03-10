import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);
    const studySet = await prisma.studySet.findUnique({
      where: { id },
      include: { terms: true },
    });

    if (!studySet) {
      return new Response("Study set not found", { status: 404 });
    }

    return NextResponse.json(studySet);
  } catch (error) {
    console.error("Error fetching study set:", error);
    return new Response("Error fetching study set", { status: 500 });
  }
}
