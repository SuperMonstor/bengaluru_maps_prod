"use client"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CREATE_MAP_CONTENT } from "@/lib/constants/createMapContent"
import { AlertCircle, Check } from "lucide-react"

interface MapOwnershipModalProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	isSubmitting: boolean
}

export default function MapOwnershipModal({
	isOpen,
	onOpenChange,
	onConfirm,
	isSubmitting,
}: MapOwnershipModalProps) {
	const ownership = CREATE_MAP_CONTENT.ownership
	const privileges = ownership.privileges

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-lg md:text-xl flex items-center gap-2 text-amber-900">
						<AlertCircle className="h-5 w-5 text-amber-600" />
						Confirm Map Creation
					</DialogTitle>
					<DialogDescription className="text-xs md:text-sm">
						By creating this map, you'll get these privileges and responsibilities
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
						<h3 className="font-semibold text-amber-900 mb-3 text-sm md:text-base">
							Your Privileges as a Map Creator
						</h3>
						<ul className="space-y-2">
							{privileges.map((privilege, index) => (
								<li
									key={index}
									className="flex items-start gap-2 text-xs md:text-sm text-amber-900"
								>
									<Check className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
									<span>{privilege}</span>
								</li>
							))}
						</ul>
					</div>

					<p className="text-xs md:text-sm text-gray-600 italic">
						"{ownership.agreement}"
					</p>
				</div>

				<DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
						className="text-xs md:text-sm"
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={onConfirm}
						disabled={isSubmitting}
						className="bg-amber-600 hover:bg-amber-700 text-white text-xs md:text-sm"
					>
						{isSubmitting ? (
							<div className="flex items-center gap-2">
								<svg
									className="animate-spin h-4 w-4"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Creating Map...
							</div>
						) : (
							"I Understand, Create Map"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
