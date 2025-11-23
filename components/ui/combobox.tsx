"use client"

import * as React from "react"
import { cn } from "@/lib/utils/utils"

interface ComboboxContextValue {
	onSelect: (value: string) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)

interface ComboboxProps {
	onSelect: (value: string) => void
	children: React.ReactNode
	className?: string
	"aria-labelledby"?: string
}

function Combobox({ onSelect, children, className, ...props }: ComboboxProps) {
	return (
		<ComboboxContext.Provider value={{ onSelect }}>
			<div className={cn("relative", className)} {...props}>
				{children}
			</div>
		</ComboboxContext.Provider>
	)
}

interface ComboboxInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
	({ className, ...props }, ref) => {
		return (
			<input
				ref={ref}
				type="text"
				autoComplete="off"
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
					className
				)}
				{...props}
			/>
		)
	}
)
ComboboxInput.displayName = "ComboboxInput"

interface ComboboxPopoverProps {
	children: React.ReactNode
	className?: string
}

function ComboboxPopover({ children, className }: ComboboxPopoverProps) {
	return (
		<div
			className={cn(
				"absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg",
				className
			)}
		>
			{children}
		</div>
	)
}

interface ComboboxListProps {
	children: React.ReactNode
	className?: string
}

function ComboboxList({ children, className }: ComboboxListProps) {
	return (
		<ul
			role="listbox"
			className={cn("max-h-60 overflow-auto py-1", className)}
		>
			{children}
		</ul>
	)
}

interface ComboboxOptionProps {
	value: string
	children: React.ReactNode
	className?: string
}

function ComboboxOption({ value, children, className }: ComboboxOptionProps) {
	const context = React.useContext(ComboboxContext)

	return (
		<li
			role="option"
			className={cn(
				"cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground",
				className
			)}
			onClick={() => context?.onSelect(value)}
		>
			{children}
		</li>
	)
}

export {
	Combobox,
	ComboboxInput,
	ComboboxPopover,
	ComboboxList,
	ComboboxOption,
}
