import { fetchModels } from "tokenlens"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider") || "vercel"
  const catalog = await fetchModels({ provider })
  if (!catalog) {
    return NextResponse.json(null, { status: 404 })
  }
  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  })
}
