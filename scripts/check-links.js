#!/usr/bin/env node

/**
 * This script checks for broken links on the Bengaluru Maps website
 * Run with: node scripts/check-links.js
 */

const https = require("https")
const http = require("http")
const { URL } = require("url")
const fs = require("fs")
const path = require("path")

// Base URL of the site
const BASE_URL = "https://www.bengalurumaps.com"
// Fallback URL for development testing
const DEV_URL =
	"https://bengaluru-maps-opdojafeq-supermonstors-projects.vercel.app"

// URLs to check (add more as needed)
const urlsToCheck = [
	"/",
	"/create-map",
	"/my-maps",
	"/sitemap.xml",
	"/robots.txt",
	"/site.webmanifest",
	"/images/og-image.jpg",
	"/images/favicon-32x32.png",
	"/images/favicon-16x16.png",
	"/images/apple-touch-icon.png",
	"/images/safari-pinned-tab.svg",
]

// Track checked URLs to avoid duplicates
const checkedUrls = new Set()
// Track broken links
const brokenLinks = []

/**
 * Check if a URL is valid
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} - Promise resolving to true if URL is valid
 */
async function checkUrl(url) {
	if (checkedUrls.has(url)) {
		return true
	}

	checkedUrls.add(url)
	console.log(`Checking: ${url}`)

	return new Promise((resolve) => {
		try {
			const parsedUrl = new URL(url)
			const protocol = parsedUrl.protocol === "https:" ? https : http

			const req = protocol.request(
				{
					hostname: parsedUrl.hostname,
					path: parsedUrl.pathname + parsedUrl.search,
					method: "HEAD",
					timeout: 10000,
				},
				(res) => {
					const statusCode = res.statusCode

					if (statusCode >= 200 && statusCode < 400) {
						console.log(`✅ ${url} - Status: ${statusCode}`)
						resolve(true)
					} else {
						console.error(`❌ ${url} - Status: ${statusCode}`)
						brokenLinks.push({ url, status: statusCode })
						resolve(false)
					}
				}
			)

			req.on("error", (error) => {
				console.error(`❌ ${url} - Error: ${error.message}`)
				brokenLinks.push({ url, error: error.message })
				resolve(false)
			})

			req.on("timeout", () => {
				console.error(`❌ ${url} - Error: Request timed out`)
				req.destroy()
				brokenLinks.push({ url, error: "Request timed out" })
				resolve(false)
			})

			req.end()
		} catch (error) {
			console.error(`❌ ${url} - Error: ${error.message}`)
			brokenLinks.push({ url, error: error.message })
			resolve(false)
		}
	})
}

/**
 * Main function to check all URLs
 */
async function checkAllUrls() {
	console.log("Starting link checker for Bengaluru Maps")
	console.log("======================================")

	// Check if we should use the development URL
	const useDev = process.argv.includes("--dev")
	const baseUrl = useDev ? DEV_URL : BASE_URL
	console.log(`Using base URL: ${baseUrl}`)

	for (const path of urlsToCheck) {
		const url = path.startsWith("http") ? path : `${baseUrl}${path}`
		await checkUrl(url)
	}

	// Report results
	console.log("\nLink Check Results:")
	console.log("======================================")
	console.log(`Total URLs checked: ${checkedUrls.size}`)
	console.log(`Broken links found: ${brokenLinks.length}`)

	if (brokenLinks.length > 0) {
		console.log("\nBroken Links:")
		brokenLinks.forEach((link, index) => {
			console.log(`${index + 1}. ${link.url}`)
			console.log(`   Error: ${link.status || link.error}`)
		})

		// Write report to file
		const report = {
			date: new Date().toISOString(),
			totalChecked: checkedUrls.size,
			brokenLinksCount: brokenLinks.length,
			brokenLinks,
		}

		fs.writeFileSync(
			path.join(__dirname, "../broken-links-report.json"),
			JSON.stringify(report, null, 2)
		)

		console.log("\nReport saved to broken-links-report.json")
		process.exit(1) // Exit with error code
	} else {
		console.log("\n✅ All links are working correctly!")
		process.exit(0) // Exit successfully
	}
}

// Run the link checker
checkAllUrls().catch((error) => {
	console.error("Error running link checker:", error)
	process.exit(1)
})
