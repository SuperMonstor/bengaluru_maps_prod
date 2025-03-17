import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
			},
			{
				protocol: "https",
				hostname: "omnlyrfivyoazohpwdzu.supabase.co",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "maps.googleapis.com",
			},
		],
		// Enable image optimization
		formats: ["image/avif", "image/webp"],
		minimumCacheTTL: 60,
	},
	// Enable React strict mode for better development experience
	reactStrictMode: true,
	// Enable SWC minification for faster builds
	swcMinify: true,
	// Optimize fonts
	optimizeFonts: true,
	// Enable compression
	compress: true,
	// Increase performance budget
	experimental: {
		// Enable server components
		serverActions: true,
		// Enable optimizations
		optimizeCss: true,
		// Optimize package imports
		optimizePackageImports: [
			"lucide-react",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-avatar",
		],
	},
}

export default nextConfig
