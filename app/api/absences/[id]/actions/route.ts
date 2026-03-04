import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params
  return NextResponse.json(
    {
      success: false,
      error: "Endpoint obsolète. Utilisez PATCH /api/absences/[id] (pattern congés)."
    },
    { status: 410 }
  )
}
