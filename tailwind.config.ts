import type { Config } from "tailwindcss"

export default {
	// darkMode: ["class"],
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
				// Brand colors - warm orange accent
				brand: {
					orange: {
						DEFAULT: "#FF6A00",
						hover: "#E55F00",
						light: "#FFF4E6",
					},
					slate: {
						DEFAULT: "#0F172A",
						light: "#64748B",
					},
				},
				// 5-step grayscale system for consistent UI
				gray: {
					900: "#111111", // Primary text, headings
					700: "#444444", // Secondary text
					500: "#777777", // Tertiary text, disabled states
					300: "#dddddd", // Borders, dividers
					100: "#f5f5f5", // Backgrounds, subtle fills
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
				// Design system specific radii
				card: "12px", // Standard card radius
				button: "8px", // Button radius
				image: "8px", // Image radius
				pill: "9999px", // Pill-shaped elements
			},
			// Typography - Premium scale
			fontSize: {
				// Headers - consistent scale
				h1: [
					"28px",
					{ lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" },
				],
				h2: [
					"22px",
					{ lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" },
				],
				h3: [
					"18px",
					{ lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "500" },
				],
				// Body text
				body: ["15px", { lineHeight: "1.5", fontWeight: "400" }],
				"body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
				caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
			},

			// Spacing - Design system scale
			spacing: {
				xs: "4px",
				sm: "8px",
				md: "12px",
				lg: "16px",
				xl: "24px",
				"2xl": "32px",
				"3xl": "48px",
				"4xl": "64px",
				// Layout-specific
				"left-panel": "440px", // Fixed left panel width
				"left-panel-content": "380px", // Max content width in left panel
				"card-max": "800px", // Max width for homepage cards
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
				"spin-slow": {
					to: { transform: "rotate(-360deg)" },
				},
				"slide-up": {
					from: { transform: "translateY(100%)" },
					to: { transform: "translateY(0)" },
				},
				"slide-down": {
					from: { transform: "translateY(0)" },
					to: { transform: "translateY(100%)" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.2s ease-out",
				"fade-out": "fade-out 0.2s ease-out",
				"spin-slow": "spin-slow 3s linear infinite",
				"slide-up": "slide-up 0.3s ease-out",
				"slide-down": "slide-down 0.3s ease-out",
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

			// Box shadows - subtle and intentional
			boxShadow: {
				card: "0 1px 3px 0 rgba(0, 0, 0, 0.06)", // Subtle default
				"card-hover": "0 4px 12px 0 rgba(0, 0, 0, 0.08)", // Hover state
				dropdown: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
				button: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", // Subtle button shadow
			},

			// Max width
			maxWidth: {
				content: "1120px",
				"content-sm": "640px",
			},
		},
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config
