"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/lib/hooks/use-toast"
import {
	getInviteTokenAction,
	generateInviteTokenAction,
	getCollaboratorsAction,
	removeCollaboratorAction,
} from "@/lib/supabase/api/collaboratorActions"
import { CollaboratorWithUser } from "@/lib/types/mapTypes"
import { Copy, RefreshCw, UserMinus, Users, Link2, Loader2 } from "lucide-react"

interface CollaboratorsSectionProps {
	mapId: string
	isOwner: boolean
}

export function CollaboratorsSection({ mapId, isOwner }: CollaboratorsSectionProps) {
	const { toast } = useToast()
	const [loading, setLoading] = useState(true)
	const [inviteUrl, setInviteUrl] = useState<string | null>(null)
	const [collaborators, setCollaborators] = useState<CollaboratorWithUser[]>([])
	const [regenerating, setRegenerating] = useState(false)
	const [removingId, setRemovingId] = useState<string | null>(null)

	useEffect(() => {
		async function fetchData() {
			setLoading(true)

			// Fetch collaborators
			const collabResult = await getCollaboratorsAction(mapId)
			if (collabResult.success && collabResult.data) {
				setCollaborators(collabResult.data.collaborators)
			}

			// Fetch invite token (only for owner)
			if (isOwner) {
				const tokenResult = await getInviteTokenAction(mapId)
				if (tokenResult.success && tokenResult.data) {
					setInviteUrl(tokenResult.data.inviteUrl)
				}
			}

			setLoading(false)
		}

		fetchData()
	}, [mapId, isOwner])

	const handleCopyLink = async () => {
		if (!inviteUrl) return

		try {
			await navigator.clipboard.writeText(inviteUrl)
			toast({
				title: "Copied!",
				description: "Invite link copied to clipboard",
			})
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to copy link",
			})
		}
	}

	const handleRegenerateLink = async () => {
		setRegenerating(true)

		const result = await generateInviteTokenAction(mapId)
		if (result.success && result.data) {
			setInviteUrl(result.data.inviteUrl)
			toast({
				title: "Link regenerated",
				description: "Old invite links are now invalid",
			})
		} else {
			toast({
				variant: "destructive",
				title: "Error",
				description: result.error || "Failed to regenerate link",
			})
		}

		setRegenerating(false)
	}

	const handleRemoveCollaborator = async (userId: string, userName: string) => {
		setRemovingId(userId)

		const result = await removeCollaboratorAction(mapId, userId)
		if (result.success) {
			setCollaborators((prev) => prev.filter((c) => c.user_id !== userId))
			toast({
				title: "Removed",
				description: `${userName} has been removed as a collaborator`,
			})
		} else {
			toast({
				variant: "destructive",
				title: "Error",
				description: result.error || "Failed to remove collaborator",
			})
		}

		setRemovingId(null)
	}

	if (loading) {
		return (
			<div className="bg-white p-6 rounded-lg shadow-sm">
				<div className="flex items-center gap-2 mb-4">
					<Users className="h-5 w-5" />
					<h2 className="text-lg font-semibold">Collaborators</h2>
				</div>
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			</div>
		)
	}

	return (
		<div className="bg-white p-6 rounded-lg shadow-sm">
			<div className="flex items-center gap-2 mb-4">
				<Users className="h-5 w-5" />
				<h2 className="text-lg font-semibold">Collaborators</h2>
			</div>

			{/* Invite Link Section (Owner only) */}
			{isOwner && (
				<div className="space-y-3 mb-6">
					<Label className="flex items-center gap-2">
						<Link2 className="h-4 w-4" />
						Invite Link
					</Label>
					<p className="text-sm text-muted-foreground">
						Share this link to invite collaborators. They&apos;ll be able to add locations and approve submissions.
					</p>
					<div className="flex gap-2">
						<Input
							value={inviteUrl || ""}
							readOnly
							className="flex-1 bg-muted/50"
							placeholder="No invite link generated"
						/>
						<Button
							variant="outline"
							size="icon"
							onClick={handleCopyLink}
							disabled={!inviteUrl}
							title="Copy link"
						>
							<Copy className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={handleRegenerateLink}
							disabled={regenerating}
							title="Regenerate link (invalidates old link)"
						>
							{regenerating ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<RefreshCw className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			)}

			{/* Collaborators List */}
			<div className="space-y-3">
				<Label>Current Collaborators</Label>
				{collaborators.length === 0 ? (
					<p className="text-sm text-muted-foreground py-4 text-center">
						No collaborators yet. Share the invite link to add people.
					</p>
				) : (
					<ul className="space-y-2">
						{collaborators.map((collab) => {
							const userName = `${collab.user?.first_name || ""} ${collab.user?.last_name || ""}`.trim() || "Unknown User"
							return (
								<li
									key={collab.id}
									className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
								>
									<div className="flex items-center gap-3">
										<Avatar className="h-8 w-8">
											<AvatarImage src={collab.user?.picture_url || undefined} />
											<AvatarFallback>{userName[0]}</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-medium">{userName}</p>
											<p className="text-xs text-muted-foreground">
												Joined {new Date(collab.joined_at).toLocaleDateString()}
											</p>
										</div>
									</div>
									{isOwner && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveCollaborator(collab.user_id, userName)}
											disabled={removingId === collab.user_id}
											className="text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											{removingId === collab.user_id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<UserMinus className="h-4 w-4" />
											)}
										</Button>
									)}
								</li>
							)
						})}
					</ul>
				)}
			</div>
		</div>
	)
}
