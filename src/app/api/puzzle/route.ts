import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json(
      { error: "date parameter required" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://www.nytimes.com/svc/connections/v2/${date}.json`,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch puzzle" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching puzzle:", error);
    return NextResponse.json(
      { error: "Failed to fetch puzzle" },
      { status: 500 },
    );
  }
}
