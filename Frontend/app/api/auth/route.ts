import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const { action } = body
  const backend = "http://localhost:5000/api/auth"

  console.log("Auth request:", action)

  try {
    let endpoint = ""
    let data = {}

    if (action === "login") {
      endpoint = `${backend}/login`
      data = { email: body.email, password: body.password }
    } else if (action === "register") {
      endpoint = `${backend}/register`
      data = {
        name: body.name,
        email: body.email,
        password: body.password,
        phoneNumber: body.phoneNumber,
        whatsappNumber: body.whatsappNumber,
      }
    } else if (action === "google") {
      endpoint = `${backend}/google`
      data = { credential: body.credential }
    } else if (action === "me") {
      endpoint = `${backend}/me`
    }

    if (!endpoint) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" }

    if (action === "me" && body.token) {
      headers["Authorization"] = `Bearer ${body.token}`
    }

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    })

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error("Backend error:", errorText)
      return NextResponse.json(
        {
          error: `Backend error: ${resp.status}`,
          details: errorText,
        },
        { status: resp.status },
      )
    }

    const responseData = await resp.json().catch((parseError) => {
      console.error("Failed to parse JSON:", parseError)
      return { error: "Invalid JSON response" }
    })

    return NextResponse.json(responseData, { status: 200 })
  } catch (e: any) {
    console.error("API Error:", e)
    return NextResponse.json(
      {
        error: e?.message || "Upstream error",
        details: e?.stack,
      },
      { status: 500 },
    )
  }
}

