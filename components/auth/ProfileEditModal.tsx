"use client"

import { useState, useRef } from "react"
import { UserCircle2, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog"
import { updateProfileAction } from "@/lib/supabase/api/updateProfileAction"
import { useToast } from "@/lib/hooks/use-toast"
import Image from "next/image"

interface ProfileEditModalProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	currentUser?: {
		id: string
		firstName: string
		lastName: string
		pictureUrl: string | null
		email?: string
	}
	onSuccess?: () => void
}

export function ProfileEditModal({
	isOpen,
	onOpenChange,
	currentUser,
	onSuccess,
}: ProfileEditModalProps) {
	const [firstName, setFirstName] = useState(currentUser?.firstName || "")
	const [lastName, setLastName] = useState(currentUser?.lastName || "")
	const [profilePicture, setProfilePicture] = useState<File | null>(null)
	const [picturePreview, setPicturePreview] = useState<string | null>(
		currentUser?.pictureUrl || null
	)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { toast } = useToast()

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast({
				variant: "destructive",
				title: "Invalid file",
				description: "Please select an image file (JPEG, PNG, or WebP)",
			})
			return
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			toast({
				variant: "destructive",
				title: "File too large",
				description: "Please select an image smaller than 5MB",
			})
			return
		}

		setProfilePicture(file)

		// Create preview
		const reader = new FileReader()
		reader.onloadend = () => {
			setPicturePreview(reader.result as string)
		}
		reader.readAsDataURL(file)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Validate that at least one field is filled
		if (!firstName.trim() && !lastName.trim() && !profilePicture) {
			toast({
				variant: "destructive",
				title: "No changes",
				description: "Please update at least one field",
			})
			return
		}

		setIsSubmitting(true)
		try {
			const formData = new FormData()
			if (firstName.trim()) formData.append("firstName", firstName.trim())
			if (lastName.trim()) formData.append("lastName", lastName.trim())
			if (profilePicture) formData.append("profilePicture", profilePicture)

			const result = await updateProfileAction(formData)

			if (result.success) {
				toast({
					title: "Profile updated",
					description: "Your profile has been saved successfully",
				})
				onOpenChange(false)
				onSuccess?.()
			} else {
				toast({
					variant: "destructive",
					title: "Error updating profile",
					description: result.error || "An unexpected error occurred",
				})
			}
		} catch (error) {
			console.error("Error updating profile:", error)
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to update profile. Please try again.",
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleOpenChange = (newOpen: boolean) => {
		if (!isSubmitting) {
			onOpenChange(newOpen)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Edit Your Profile</DialogTitle>
					<DialogDescription>
						Add a profile picture and update your name to personalize your account
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6 py-4">
					{/* Profile Picture Section */}
					<div className="space-y-3">
						<Label className="text-sm font-semibold">Profile Picture</Label>

						<div className="flex flex-col items-center gap-4">
							{/* Picture Preview */}
							<div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden border-2 border-gray-200">
								{picturePreview ? (
									<Image
										src={picturePreview}
										alt="Profile preview"
										width={96}
										height={96}
										className="w-full h-full object-cover"
									/>
								) : currentUser?.pictureUrl ? (
									<Image
										src={currentUser.pictureUrl}
										alt="Current profile"
										width={96}
										height={96}
										className="w-full h-full object-cover"
									/>
								) : (
									<UserCircle2 className="w-12 h-12 text-white" />
								)}
							</div>

							{/* File Input */}
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleFileSelect}
								accept="image/jpeg,image/png,image/webp"
								className="hidden"
							/>

							{/* Upload Button */}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
								disabled={isSubmitting}
								className="gap-2"
							>
								<Upload className="w-4 h-4" />
								{profilePicture ? "Change Picture" : "Upload Picture"}
							</Button>

							{profilePicture && (
								<p className="text-xs text-muted-foreground">
									{profilePicture.name}
								</p>
							)}
						</div>
					</div>

					{/* Name Fields */}
					<div className="space-y-4">
						{/* First Name */}
						<div className="space-y-2">
							<Label htmlFor="firstName" className="text-sm font-medium">
								First Name
							</Label>
							<Input
								id="firstName"
								placeholder="Your first name"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								disabled={isSubmitting}
								className="h-10"
							/>
						</div>

						{/* Last Name */}
						<div className="space-y-2">
							<Label htmlFor="lastName" className="text-sm font-medium">
								Last Name
							</Label>
							<Input
								id="lastName"
								placeholder="Your last name"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								disabled={isSubmitting}
								className="h-10"
							/>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 bg-orange-600 hover:bg-orange-700"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
