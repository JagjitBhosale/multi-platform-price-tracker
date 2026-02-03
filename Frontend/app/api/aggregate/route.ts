import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const backend =  "http://localhost:5000/api/aggregate-scrape"

  console.log("API request body:", body)

  try {
    // Create timeout controller for better compatibility
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

    const resp = await fetch(backend, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    console.log("Backend response status:", resp.status)
    console.log("Backend response headers:", Object.fromEntries(resp.headers.entries()))

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error("Backend error response:", errorText)
      return NextResponse.json({ 
        error: `Backend error: ${resp.status} ${resp.statusText}`,
        details: errorText 
      }, { status: resp.status })
    }

    const data = await resp.json().catch((parseError) => {
      console.error("Failed to parse JSON response:", parseError)
      return { error: "Invalid JSON response from backend" }
    })
    
    console.log("Backend response data:", JSON.stringify(data, null, 2))
    
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    console.error("API Error:", e)
    
    // Check if it's a connection error
    if (e?.message?.includes("fetch failed") || e?.code === "ECONNREFUSED") {
      return NextResponse.json({ 
        error: "Cannot connect to backend server",
        details: "Please make sure the backend server is running on port 5000. Run 'npm run dev' in the Backend directory.",
        message: "Backend server is not running. Please start it with 'cd Backend && npm run dev'"
      }, { status: 503 })
    }
    
    // Check if it's a timeout
    if (e?.name === "TimeoutError" || e?.name === "AbortError" || e?.message?.includes("timeout") || e?.message?.includes("aborted")) {
      return NextResponse.json({ 
        error: "Request timeout",
        details: "The backend server took too long to respond. This might be due to slow scraping.",
        message: "Scraping is taking longer than expected. Please try again."
      }, { status: 504 })
    }
    
    return NextResponse.json({ 
      error: e?.message || "Upstream error",
      details: e?.stack 
    }, { status: 500 })
  }
}
