import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const backend = "http://localhost:5000/api/tracking"

  console.log("Tracking GET request")

  try {
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resp = await fetch(backend, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error("Backend error:", errorText)
      return NextResponse.json({ error: `Backend error: ${resp.status}` }, { status: resp.status })
    }

    const data = await resp.json()
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    console.error("API Error:", e)
    return NextResponse.json({ error: e?.message || "Upstream error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  const body = await req.json()
  const backend = "http://localhost:5000/api/tracking"

  console.log("Tracking POST request:", body)

  try {
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resp = await fetch(backend, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error("Backend error:", errorText)
      return NextResponse.json({ error: `Backend error: ${resp.status}` }, { status: resp.status })
    }

    const data = await resp.json()
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    console.error("API Error:", e)
    return NextResponse.json({ error: e?.message || "Upstream error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const authHeader = req.headers.get("authorization")
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  const backend = `http://localhost:5000/api/tracking/${id}`

  console.log("Tracking DELETE request for:", id)

  try {
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resp = await fetch(backend, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error("Backend error:", errorText)
      return NextResponse.json({ error: `Backend error: ${resp.status}` }, { status: resp.status })
    }

    const data = await resp.json()
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    console.error("API Error:", e)
    return NextResponse.json({ error: e?.message || "Upstream error" }, { status: 500 })
  }
}

