import { useState } from "react"
import { createClient } from "@/lib/supabase/api/supabaseClient"

export interface UserInfo {
	username: string
	profilePicture: string | null
}

export function useUserInfo() {
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
	const supabase = createClient()

	const fetchUserInfo = async (creatorId: string) => {
		try {
			const { data, error } = await supabase
				.from("users")
				.select("first_name, last_name, picture_url")
				.eq("id", creatorId)
				.single()

			if (error) throw error

			const username = `${data.first_name || "Unnamed"} ${data.last_name || "User"
				}`.trim()
			setUserInfo({
				username,
				profilePicture: data.picture_url || null,
			})
		} catch (error) {
			console.error("Error fetching user info:", error)
			setUserInfo({ username: "Unknown User", profilePicture: null })
		}
	}

	return { userInfo, fetchUserInfo }
}
