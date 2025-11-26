import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/utils"

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap text-body font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				// Primary: Main actions with brand orange
				primary: "bg-brand-orange text-white rounded-button hover:bg-brand-orange-hover shadow-button hover:shadow-md",
				// Secondary: Supporting actions with outline
				secondary:
					"border border-gray-300 bg-transparent text-gray-700 rounded-button hover:border-gray-500 hover:bg-gray-100",
				// Tertiary: Subtle actions, text-only
				tertiary: "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-button",
				// Destructive: Delete/remove actions
				destructive:
					"border border-red-200 bg-transparent text-red-600 rounded-button hover:bg-red-50 hover:text-red-700",
				// Legacy support (gradually migrate away)
				default: "bg-brand-orange text-white rounded-button hover:bg-brand-orange-hover shadow-button",
				outline:
					"border border-gray-300 bg-transparent text-gray-700 rounded-button hover:border-gray-500 hover:bg-gray-100",
				ghost: "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-button",
				link: "text-brand-orange underline-offset-4 hover:underline",
			},
			size: {
				default: "h-11 px-6",
				sm: "h-9 px-4 text-body-sm",
				lg: "h-12 px-8",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button"
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		)
	}
)
Button.displayName = "Button"

export { Button, buttonVariants }
