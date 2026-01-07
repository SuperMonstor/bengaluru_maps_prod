"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProfileEditModal } from "./ProfileEditModal"
import { useUser } from "@/components/layout/LayoutClient"

export function ProfileModalTrigger() {
	const router = useRouter()
	const { user } = useUser()
	const [isModalOpen, setIsModalOpen] = useState(false)

	useEffect(() => {
		// Check for the show_profile_modal cookie on component mount
		const cookies = document.cookie.split("; ")
		const showProfileModal = cookies.find((c) => c.startsWith("show_profile_modal="))

		if (showProfileModal && user) {
			// Show the modal
			setIsModalOpen(true)
			// Delete the cookie
			deleteCookie("show_profile_modal")
		}
	}, [user])

	const deleteCookie = (name: string) => {
		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
	}

	const handleModalOpenChange = (open: boolean) => {
		setIsModalOpen(open)
		if (!open) {
			// Ensure cookie is deleted when modal closes
			deleteCookie("show_profile_modal")
		}
	}

	const handleSuccess = () => {
		// Refresh the page to update user data from server
		router.refresh()
	}

	if (!user) return null

	return (
		<ProfileEditModal
			isOpen={isModalOpen}
			onOpenChange={handleModalOpenChange}
			currentUser={{
				id: user.id,
				firstName: user.first_name || "",
				lastName: user.last_name || "",
				pictureUrl: user.picture_url,
				email: user.email,
			}}
			onSuccess={handleSuccess}
		/>
	)
}
