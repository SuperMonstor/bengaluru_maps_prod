"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteLocationAction } from "@/lib/supabase/api/deleteLocationAction"
import { useToast } from "@/lib/hooks/use-toast"

interface DeleteLocationDialogProps {
	locationId: string
	locationName: string
	onDeleted: () => void
	onCancel: () => void
}

export default function DeleteLocationDialog({
	locationId,
	locationName,
	onDeleted,
	onCancel,
}: DeleteLocationDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false)
	const { toast } = useToast()

	const handleDelete = async () => {
		if (isDeleting) return

		setIsDeleting(true)
		try {
			const result = await deleteLocationAction(locationId)

			if (result.success) {
				toast({
					title: "Location deleted",
					description: "The location has been removed from the map.",
				})
				onDeleted()
			} else {
				toast({
					variant: "destructive",
					title: "Error deleting location",
					description: result.error || "An unexpected error occurred",
				})
				onCancel()
			}
		} catch (error) {
			console.error("Error deleting location:", error)
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to delete location. Please try again.",
			})
			onCancel()
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
				<div className="flex items-center gap-3 mb-4">
					<div className="bg-red-100 p-2 rounded-full">
						<Trash2 className="h-5 w-5 text-red-600" />
					</div>
					<h3 className="text-lg font-semibold">Delete Location</h3>
				</div>

				<p className="mb-4 text-muted-foreground">
					Are you sure you want to delete{" "}
					<span className="font-medium text-foreground">{locationName}</span>?
					This action cannot be undone.
				</p>

				<div className="flex justify-end gap-3 mt-6">
					<Button variant="outline" onClick={onCancel} disabled={isDeleting}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete Location"}
					</Button>
				</div>
			</div>
		</div>
	)
}
