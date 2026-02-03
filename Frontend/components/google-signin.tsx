"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export function GoogleSignIn({ onSuccess }: { onSuccess?: () => void }) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { login } = useAuth()
  const [scriptLoaded, setScriptLoaded] = useState(false)
  
  // Get Google Client ID from environment variable (available at build time in Next.js)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google && buttonRef.current && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          })

          window.google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            width: "100%",
          })
        } catch (error) {
          console.error("Error initializing Google Sign-In:", error)
        }
      }
    }

    // Check if script already exists and loaded
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript && window.google) {
      // Small delay to ensure everything is ready
      setTimeout(initializeGoogle, 100)
      return
    }

    // Load Google Identity Services script
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setScriptLoaded(true)
      // Wait a bit for Google API to be fully available
      setTimeout(initializeGoogle, 100)
    }
    
    script.onerror = () => {
      console.error("Failed to load Google Identity Services script")
    }
    
    document.head.appendChild(script)
  }, [])

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "google",
          credential: response.credential,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Google sign-in failed")
      }

      // Store token and user info
      if (login) {
        login(data.token, data.user)
      } else {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      toast.success("Signed in with Google!")
      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => router.push("/dashboard"), 500)
      }
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed")
    }
  }

  if (!googleClientId) {
    return (
      <div className="text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-xl">
        Google Sign-In is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file and restart the dev server.
      </div>
    )
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full" />
    </div>
  )
}

