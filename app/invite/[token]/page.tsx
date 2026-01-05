"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/components/layout/LayoutClient"
import { signInWithGoogle, setAuthRedirect } from "@/lib/utils/auth"
import { getMapByInviteTokenAction, acceptInviteAction } from "@/lib/supabase/api/collaboratorActions"
import { useToast } from "@/lib/hooks/use-toast"
import { Loader2, MapPin, Users, CheckCircle, XCircle } from "lucide-react"
import googleLogo from "@/public/google.svg"

interface MapInfo {
	id: string
	name: string
	shortDescription: string
	displayPicture: string | null
	slug: string
	ownerName: string
	ownerPicture: string | null
	isAlreadyCollaborator: boolean
	isOwner: boolean
}

export default function InvitePage() {
	const params = useParams()
	const router = useRouter()
	const { user } = useUser()
	const { toast } = useToast()
	const token = params.token as string

	const [loading, setLoading] = useState(true)
	const [accepting, setAccepting] = useState(false)
	const [mapInfo, setMapInfo] = useState<MapInfo | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchMapInfo() {
			setLoading(true)
			const result = await getMapByInviteTokenAction(token)

			if (!result.success || !result.data) {
				setError(result.error || "Invalid invite link")
				setLoading(false)
				return
			}

			setMapInfo(result.data)
			setLoading(false)
		}

		if (token) {
			fetchMapInfo()
		}
	}, [token])

	const handleSignIn = async () => {
		// Set redirect to come back to this page after login
		setAuthRedirect(`/invite/${token}`)
		await signInWithGoogle()
	}

	const handleAccept = async () => {
		if (!user) return

		setAccepting(true)
		const result = await acceptInviteAction(token)

		if (!result.success) {
			toast({
				variant: "destructive",
				title: "Error",
				description: result.error || "Failed to accept invite",
			})
			setAccepting(false)
			return
		}

		toast({
			title: "Welcome!",
			description: `You are now a collaborator on "${mapInfo?.name}"`,
		})

		// Redirect to the map
		router.push(`/maps/${result.data?.mapSlug}`)
	}

	const handleDecline = () => {
		router.push("/")
	}

	// Loading state
	if (loading) {
		return (
			<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</main>
		)
	}

	// Error state
	if (error) {
		return (
			<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
						<CardTitle>Invalid Invite</CardTitle>
						<CardDescription>{error}</CardDescription>
					</CardHeader>
					<CardFooter className="justify-center">
						<Button variant="outline" onClick={() => router.push("/")}>
							Go Home
						</Button>
					</CardFooter>
				</Card>
			</main>
		)
	}

	// Already a collaborator
	if (mapInfo?.isAlreadyCollaborator) {
		return (
			<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
						<CardTitle>Already a Collaborator</CardTitle>
						<CardDescription>
							You are already a collaborator on &quot;{mapInfo.name}&quot;
						</CardDescription>
					</CardHeader>
					<CardFooter className="justify-center">
						<Button onClick={() => router.push(`/maps/${mapInfo.slug}`)}>
							Go to Map
						</Button>
					</CardFooter>
				</Card>
			</main>
		)
	}

	// Owner trying to use their own link
	if (mapInfo?.isOwner) {
		return (
			<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
						<CardTitle>This is your map!</CardTitle>
						<CardDescription>
							You are the owner of &quot;{mapInfo.name}&quot;
						</CardDescription>
					</CardHeader>
					<CardFooter className="justify-center">
						<Button onClick={() => router.push(`/maps/${mapInfo.slug}`)}>
							Go to Map
						</Button>
					</CardFooter>
				</Card>
			</main>
		)
	}

	// Not logged in - show login prompt
	if (!user) {
		return (
			<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<Users className="h-12 w-12 text-primary mx-auto mb-2" />
						<CardTitle>You&apos;re Invited!</CardTitle>
						<CardDescription>
							Sign in to join &quot;{mapInfo?.name}&quot; as a collaborator
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{mapInfo?.displayPicture && (
							<div className="aspect-video rounded-lg overflow-hidden bg-muted">
								<img
									src={mapInfo.displayPicture}
									alt={mapInfo.name}
									className="w-full h-full object-cover"
								/>
							</div>
						)}
						<p className="text-sm text-muted-foreground text-center">
							{mapInfo?.shortDescription}
						</p>
						<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
							<span>Created by</span>
							<Avatar className="h-6 w-6">
								<AvatarImage src={mapInfo?.ownerPicture || undefined} />
								<AvatarFallback>{mapInfo?.ownerName?.[0]}</AvatarFallback>
							</Avatar>
							<span>{mapInfo?.ownerName}</span>
						</div>
					</CardContent>
					<CardFooter className="flex-col gap-3">
						<Button
							variant="outline"
							className="w-full flex items-center justify-center gap-2"
							onClick={handleSignIn}
						>
							<img src={googleLogo.src} alt="Google" className="w-5 h-5" />
							Sign in with Google
						</Button>
						<Button variant="ghost" className="w-full" onClick={handleDecline}>
							No thanks
						</Button>
					</CardFooter>
				</Card>
			</main>
		)
	}

	// Logged in - show accept/decline
	return (
		<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<Users className="h-12 w-12 text-primary mx-auto mb-2" />
					<CardTitle>Join as Collaborator?</CardTitle>
					<CardDescription>
						You&apos;ve been invited to collaborate on &quot;{mapInfo?.name}&quot;
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{mapInfo?.displayPicture && (
						<div className="aspect-video rounded-lg overflow-hidden bg-muted">
							<img
								src={mapInfo.displayPicture}
								alt={mapInfo.name}
								className="w-full h-full object-cover"
							/>
						</div>
					)}
					<p className="text-sm text-muted-foreground text-center">
						{mapInfo?.shortDescription}
					</p>
					<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<span>Created by</span>
						<Avatar className="h-6 w-6">
							<AvatarImage src={mapInfo?.ownerPicture || undefined} />
							<AvatarFallback>{mapInfo?.ownerName?.[0]}</AvatarFallback>
						</Avatar>
						<span>{mapInfo?.ownerName}</span>
					</div>
					<div className="bg-muted/50 rounded-lg p-3 text-sm">
						<p className="font-medium mb-1">As a collaborator, you can:</p>
						<ul className="list-disc list-inside text-muted-foreground space-y-1">
							<li>Add new locations to the map</li>
							<li>Approve or reject location submissions</li>
							<li>Edit map details</li>
						</ul>
					</div>
				</CardContent>
				<CardFooter className="flex gap-3">
					<Button
						variant="outline"
						className="flex-1"
						onClick={handleDecline}
						disabled={accepting}
					>
						Decline
					</Button>
					<Button
						className="flex-1"
						onClick={handleAccept}
						disabled={accepting}
					>
						{accepting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Joining...
							</>
						) : (
							"Accept"
						)}
					</Button>
				</CardFooter>
			</Card>
		</main>
	)
}
