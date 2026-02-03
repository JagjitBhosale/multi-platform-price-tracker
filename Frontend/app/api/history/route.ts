import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const backend = "http://localhost:5000/api/history"
  const auth = req.headers.get("authorization") || ""
  try {
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const resp = await fetch(backend, { headers: { Authorization: auth } })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upstream error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const backend = "http://localhost:5000/api/history"
  const auth = req.headers.get("authorization") || ""
  const body = await req.json()
  try {
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const resp = await fetch(backend, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upstream error" }, { status: 500 })
  }
}
