// lib/utils/auth.ts
import { createClient } from "../supabase/service/client"
import { updateUserInDatabase } from "../supabase/user-utils"
import { LoginInput } from "../validations/auth"

export async function signInWithGoogle() {
  const supabase = createClient()
  const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : "http://localhost:3000/auth/callback" // Fallback for local dev

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (error) {
    console.error("Error signing in with Google:", error.message)
    return { error }
  }

  console.log("SignInWithGoogle - Redirect data:", data)
  return { data, error: null }
}

export async function signInWithPassword(data: LoginInput) {
	const supabase = createClient()
	const { data: authData, error: authError } =
		await supabase.auth.signInWithPassword({
			email: data.email,
			password: data.password,
		})

	if (authError) {
		console.error("Error signing in with password:", authError.message)
		return { error: authError }
	}

	const { success, error: updateError } = await updateUserInDatabase(
		authData.user
	)
	if (!success) {
		console.error("User update failed:", updateError)
		return { error: new Error(updateError) }
	}

	console.log("SignInWithPassword - Auth data:", authData)
	return { data: authData, error: null }
}
