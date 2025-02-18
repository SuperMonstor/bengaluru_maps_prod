import type { Config } from "tailwindcss"

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				chart: {
					"1": "hsl(var(--chart-1))",
					"2": "hsl(var(--chart-2))",
					"3": "hsl(var(--chart-3))",
					"4": "hsl(var(--chart-4))",
					"5": "hsl(var(--chart-5))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			// Typography
			fontSize: {
				// Headers
				display: [
					"3.75rem",
					{ lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" },
				],
				h1: [
					"2.5rem",
					{ lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
				],
				h2: [
					"2rem",
					{ lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" },
				],
				h3: [
					"1.75rem",
					{ lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" },
				],
				h4: [
					"1.5rem",
					{ lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" },
				],
				h5: [
					"1.25rem",
					{ lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" },
				],
				// Body
				"body-lg": ["1.125rem", { lineHeight: "1.5", fontWeight: "400" }],
				body: ["1rem", { lineHeight: "1.5", fontWeight: "400" }],
				"body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
				caption: ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
				// Mono (for code and technical content)
				mono: ["1rem", { lineHeight: "1.5", fontWeight: "400" }],
				"mono-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
			},

			// Spacing
			spacing: {
				layout: "1.5rem", // 24px
				"layout-lg": "2rem", // 32px
				"layout-xl": "3rem", // 48px
				section: "4rem", // 64px
				"section-lg": "6rem", // 96px
			},

			// Animation
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"fade-in": {
					from: { opacity: "0" },
					to: { opacity: "1" },
				},
				"fade-out": {
					from: { opacity: "1" },
					to: { opacity: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.2s ease-out",
				"fade-out": "fade-out 0.2s ease-out",
			},

			// Font families (for your Geist fonts)
			fontFamily: {
				sans: ["var(--font-geist-sans)"],
				mono: ["var(--font-geist-mono)"],
			},

			// Z-index
			zIndex: {
				header: "100",
				modal: "200",
				tooltip: "300",
			},

			// Box shadows
			boxShadow: {
				card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
				dropdown:
					"0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
			},

			// Max width
			maxWidth: {
				content: "1120px",
				"content-sm": "640px",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config
