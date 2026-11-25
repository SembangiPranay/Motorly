import { useEffect, useRef, useState } from "react"
import { api } from "../services/api"

const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.trim()
export const googleSignInEnabled = Boolean(clientId)

interface GoogleIdentity {
  initialize(options: {
    client_id: string
    callback: (response: { credential: string }) => void
  }): void
  renderButton(container: HTMLElement, options: { theme: string; size: string }): void
}

let identityLoader: Promise<GoogleIdentity> | undefined

function loadGoogleIdentity() {
  identityLoader ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.onload = () => {
      const identity = (
        window as Window & {
          google?: { accounts: { id: GoogleIdentity } }
        }
      ).google?.accounts.id
      if (identity) resolve(identity)
      else reject(new Error("Google sign-in did not initialize."))
    }
    script.onerror = () => {
      script.remove()
      reject(new Error("Google sign-in could not be loaded."))
    }
    document.head.append(script)
  }).catch((error: unknown) => {
    identityLoader = undefined
    throw error
  })
  return identityLoader
}

export default function AdminGoogleSignIn({ onSuccess }: { onSuccess: () => void }) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const onSuccessRef = useRef(onSuccess)
  const [message, setMessage] = useState("")

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    const button = buttonRef.current
    if (!clientId || !button) return

    let active = true
    loadGoogleIdentity()
      .then((identity) => {
        if (!active) return
        identity.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            if (!active) return
            setMessage("Verifying Google account…")
            const result = await api.adminGoogleLogin(credential)
            if (!active) return
            if (result.success) onSuccessRef.current()
            else setMessage(result.message || "Google sign-in failed.")
          },
        })
        identity.renderButton(button, { theme: "outline", size: "large" })
      })
      .catch(() => {
        if (active) setMessage("Google sign-in could not be loaded. Use your admin passcode.")
      })

    return () => {
      active = false
      button.replaceChildren()
    }
  }, [])

  return (
    <div className="space-y-3 text-center">
      <div className="flex justify-center" ref={buttonRef} />
      {message && (
        <p role="status" className="text-sm text-stone-300">
          {message}
        </p>
      )}
    </div>
  )
}
