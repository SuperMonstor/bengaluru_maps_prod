"use client"

import { useState, useEffect } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/lib/hooks/use-toast"
import {
	getInviteTokenAction,
	generateInviteTokenAction,
	getCollaboratorsAction,
	removeCollaboratorAction,
} from "@/lib/supabase/api/collaboratorActions"
import { CollaboratorWithUser } from "@/lib/types/mapTypes"
import { Loader2, Copy, UserPlus, Users, X, Check } from "lucide-react"

interface InviteCollaboratorDialogProps {
	mapId: string
	isOpen: boolean
	onOpenChange: (open: boolean) => void
}

export function InviteCollaboratorDialog({
	mapId,
	isOpen,
	onOpenChange,
}: InviteCollaboratorDialogProps) {
	const { toast } = useToast()
	const [inviteUrl, setInviteUrl] = useState<string | null>(null)
	const [collaborators, setCollaborators] = useState<CollaboratorWithUser[]>([])
	const [loading, setLoading] = useState(true)
	const [generating, setGenerating] = useState(false)
	const [removing, setRemoving] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	// Fetch invite token and collaborators on open
	useEffect(() => {
		if (isOpen) {
			fetchData()
		}
	}, [isOpen, mapId])

	const fetchData = async () => {
		setLoading(true)
		try {
			const [tokenResult, collaboratorsResult] = await Promise.all([
				getInviteTokenAction(mapId),
				getCollaboratorsAction(mapId),
			])

			if (tokenResult.success && tokenResult.data?.inviteUrl) {
				setInviteUrl(tokenResult.data.inviteUrl)
			}

			if (collaboratorsResult.success && collaboratorsResult.data) {
				setCollaborators(collaboratorsResult.data.collaborators)
			}
		} catch (error) {
			console.error("Error fetching data:", error)
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load collaborator data",
			})
		} finally {
			setLoading(false)
		}
	}

	const handleGenerateLink = async () => {
		setGenerating(true)
		try {
			const result = await generateInviteTokenAction(mapId)

			if (!result.success) {
				toast({
					variant: "destructive",
					title: "Error",
					description: result.error || "Failed to generate invite link",
				})
				return
			}

			if (result.data?.inviteUrl) {
				setInviteUrl(result.data.inviteUrl)
				toast({
					title: "Invite link created",
					description: "You can now share this link with collaborators",
				})
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to generate invite link",
			})
		} finally {
			setGenerating(false)
		}
	}

	const handleCopyLink = async () => {
		if (!inviteUrl) return

		try {
			await navigator.clipboard.writeText(inviteUrl)
			setCopied(true)
			toast({
				title: "Link copied!",
				description: "Invite link copied to clipboard",
			})
			setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Failed to copy",
				description: "Please select and copy the link manually",
			})
		}
	}

	const handleRemoveCollaborator = async (userId: string, userName: string) => {
		setRemoving(userId)
		try {
			const result = await removeCollaboratorAction(mapId, userId)

			if (!result.success) {
				toast({
					variant: "destructive",
					title: "Error",
					description: result.error || "Failed to remove collaborator",
				})
				return
			}

			// Remove from local state
			setCollaborators((prev) => prev.filter((c) => c.user_id !== userId))
			toast({
				title: "Collaborator removed",
				description: `${userName} has been removed from this map`,
			})
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to remove collaborator",
			})
		} finally {
			setRemoving(null)
		}
	}

	const getInitials = (firstName: string | null, lastName: string | null) => {
		const first = firstName?.[0] || ""
		const last = lastName?.[0] || ""
		return (first + last).toUpperCase() || "?"
	}

	const getFullName = (firstName: string | null, lastName: string | null) => {
		return `${firstName || ""} ${lastName || ""}`.trim() || "Unknown User"
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Invite Collaborators
					</DialogTitle>
					<DialogDescription>
						Share this link to invite others to collaborate on your map
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Invite Link Section */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-foreground">Invite Link</h3>

						{loading ? (
							<div className="flex items-center justify-center py-4">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : inviteUrl ? (
							<div className="space-y-2">
								<div className="flex gap-2">
									<Input
										readOnly
										value={inviteUrl}
										className="font-mono text-xs bg-muted/50"
									/>
									<Button
										variant="outline"
										size="icon"
										onClick={handleCopyLink}
										className="shrink-0"
									>
										{copied ? (
											<Check className="h-4 w-4 text-green-500" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
								<p className="text-xs text-muted-foreground">
									Anyone with this link can join as a collaborator
								</p>
							</div>
						) : (
							<div className="space-y-2">
								<Button
									onClick={handleGenerateLink}
									disabled={generating}
									className="w-full"
								>
									{generating ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Generating...
										</>
									) : (
										<>
											<UserPlus className="mr-2 h-4 w-4" />
											Generate Invite Link
										</>
									)}
								</Button>
								<p className="text-xs text-muted-foreground text-center">
									Create a shareable link to invite collaborators
								</p>
							</div>
						)}
					</div>

					{/* Collaborators Section */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-foreground">
							Collaborators ({collaborators.length})
						</h3>

						{loading ? (
							<div className="space-y-2">
								{[1, 2].map((i) => (
									<div
										key={i}
										className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 animate-pulse"
									>
										<div className="h-8 w-8 rounded-full bg-muted" />
										<div className="flex-1 space-y-1">
											<div className="h-4 w-24 bg-muted rounded" />
											<div className="h-3 w-16 bg-muted rounded" />
										</div>
									</div>
								))}
							</div>
						) : collaborators.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-6 text-center">
								<Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
								<p className="text-sm text-muted-foreground">
									No collaborators yet
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									Share your invite link to add collaborators
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{collaborators.map((collaborator) => {
									const fullName = getFullName(
										collaborator.user?.first_name ?? null,
										collaborator.user?.last_name ?? null
									)
									const initials = getInitials(
										collaborator.user?.first_name ?? null,
										collaborator.user?.last_name ?? null
									)
									const isRemoving = removing === collaborator.user_id

									return (
										<div
											key={collaborator.id}
											className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
										>
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={collaborator.user?.picture_url || undefined}
													alt={fullName}
												/>
												<AvatarFallback className="text-xs">
													{initials}
												</AvatarFallback>
											</Avatar>

											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{fullName}
												</p>
												<p className="text-xs text-muted-foreground">
													{collaborator.role === "editor" ? "Editor" : collaborator.role}
												</p>
											</div>

											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
												onClick={() =>
													handleRemoveCollaborator(
														collaborator.user_id,
														fullName
													)
												}
												disabled={isRemoving}
											>
												{isRemoving ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<X className="h-4 w-4" />
												)}
											</Button>
										</div>
									)
								})}
							</div>
						)}
					</div>

					{/* Permissions Info */}
					<div className="bg-muted/50 rounded-lg p-3 text-sm">
						<p className="font-medium mb-1 text-foreground">
							Collaborators can:
						</p>
						<ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-xs">
							<li>Add new locations to the map</li>
							<li>Approve or reject location submissions</li>
							<li>Edit map details</li>
						</ul>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
