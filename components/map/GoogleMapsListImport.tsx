"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { parseGoogleMapsListAction } from "@/lib/supabase/api/parseGoogleMapsListAction"
import { bulkImportLocationsAction } from "@/lib/supabase/api/bulkImportLocationsAction"
import { ParsedLocation } from "@/lib/services/googleMapsListService"
import { MapPin, Loader2, CheckCircle2, XCircle, Link2, ExternalLink } from "lucide-react"

interface ParseStats {
  total: number
  tier1: number
  tier3: number
}

interface GoogleMapsListImportProps {
  // For direct import mode (when map already exists)
  mapId?: string
  mapSlug?: string
  onImportComplete?: () => void
  // For preview mode (during map creation)
  previewMode?: boolean
  onLocationsChange?: (locations: ParsedLocation[]) => void
}

export function GoogleMapsListImport({
  mapId,
  mapSlug,
  onImportComplete,
  previewMode = false,
  onLocationsChange
}: GoogleMapsListImportProps) {
  const [url, setUrl] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [locations, setLocations] = useState<ParsedLocation[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [listName, setListName] = useState<string | undefined>()
  const [stats, setStats] = useState<ParseStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    tier1Imported: number
    tier3Imported: number
    errors: string[]
  } | null>(null)

  // In preview mode, notify parent of selected locations
  useEffect(() => {
    if (previewMode && onLocationsChange) {
      const selectedLocations = locations.filter((_, i) => selectedIndices.has(i))
      onLocationsChange(selectedLocations)
    }
  }, [locations, selectedIndices, previewMode, onLocationsChange])

  const handleParse = async () => {
    if (!url.trim()) {
      setError("Please enter a Google Maps list URL")
      return
    }

    setIsParsing(true)
    setError(null)
    setLocations([])
    setStats(null)
    setImportResult(null)

    try {
      const result = await parseGoogleMapsListAction(url)

      if (!result.success || !result.locations) {
        setError(result.error || "Failed to parse the list")
        return
      }

      setLocations(result.locations)
      setListName(result.listName)
      setStats(result.stats || null)
      // Select all by default
      setSelectedIndices(new Set(result.locations.map((_, i) => i)))

      // Debug logging for coverage analysis
      if (result.stats) {
        const { total, tier1, tier3 } = result.stats
        const coverage = total > 0 ? ((tier1 / total) * 100).toFixed(1) : 0
        console.log(`[GoogleMapsListImport] Stats: ${tier1} with /g/ pattern, ${tier3} with CID, Coverage: ${coverage}%`)

        // Log sample links from each tier
        const tier1Samples = result.locations.filter(l => l.googlePlaceId && !l.googlePlaceId.startsWith('cid:')).slice(0, 2)
        const cidSamples = result.locations.filter(l => l.googlePlaceId?.startsWith('cid:')).slice(0, 2)

        if (tier1Samples.length > 0) {
          console.log('[GoogleMapsListImport] Sample /g/ links:')
          tier1Samples.forEach(l => console.log(`  - ${l.name}: ${l.googleMapsUrl}`))
        }
        if (cidSamples.length > 0) {
          console.log('[GoogleMapsListImport] Sample CID links:')
          cidSamples.forEach(l => console.log(`  - ${l.name}: ${l.googleMapsUrl}`))
        }
      }
    } catch (err) {
      setError("An error occurred while parsing the list")
      console.error(err)
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = async () => {
    if (!mapId) {
      setError("Map ID is required for import")
      return
    }

    const selectedLocations = locations.filter((_, i) => selectedIndices.has(i))

    if (selectedLocations.length === 0) {
      setError("Please select at least one location to import")
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      const result = await bulkImportLocationsAction(mapId, selectedLocations)

      if (!result.success) {
        setError(result.error || "Failed to import locations")
        return
      }

      setImportResult({
        imported: result.imported,
        skipped: result.skipped,
        tier1Imported: result.tier1Imported,
        tier3Imported: result.tier3Imported,
        errors: result.errors,
      })

      if (result.imported > 0 && onImportComplete) {
        onImportComplete()
      }
    } catch (err) {
      setError("An error occurred while importing locations")
      console.error(err)
    } finally {
      setIsImporting(false)
    }
  }

  const toggleLocation = (index: number) => {
    const newSelected = new Set(selectedIndices)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIndices(newSelected)
  }

  const toggleAll = () => {
    if (selectedIndices.size === locations.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(locations.map((_, i) => i)))
    }
  }

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Import from Google Maps List</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Paste a public Google Maps list URL to import all locations at once.
      </p>

      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="maps-url" className="text-sm font-medium">
          Google Maps List URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="maps-url"
            type="url"
            placeholder="https://maps.app.goo.gl/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isParsing || isImporting}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleParse}
            disabled={isParsing || isImporting || !url.trim()}
            variant="secondary"
          >
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Parsing...
              </>
            ) : (
              "Fetch Locations"
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <XCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Locations Preview */}
      {locations.length > 0 && !importResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {locations.length} locations found
                {listName && <span className="text-muted-foreground"> in "{listName}"</span>}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="text-xs"
            >
              {selectedIndices.size === locations.length ? "Deselect All" : "Select All"}
            </Button>
          </div>


          <div className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border">
            {locations.map((location, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 hover:bg-accent"
              >
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                  <Checkbox
                    checked={selectedIndices.has(index)}
                    onCheckedChange={() => toggleLocation(index)}
                  />
                  <p className="font-medium text-sm truncate">{location.name}</p>
                </label>
                {location.googleMapsUrl && (
                  <a
                    href={location.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-accent-foreground/10 rounded flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Only show import button when not in preview mode */}
          {!previewMode && (
            <Button
              type="button"
              onClick={handleImport}
              disabled={isImporting || selectedIndices.size === 0}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${selectedIndices.size} Location${selectedIndices.size !== 1 ? "s" : ""}`
              )}
            </Button>
          )}

          {/* In preview mode, show a message that locations will be imported on map creation */}
          {previewMode && selectedIndices.size > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {selectedIndices.size} location{selectedIndices.size !== 1 ? "s" : ""} will be imported when you create the map
            </p>
          )}
        </div>
      )}

      {/* Import Result - only show when not in preview mode */}
      {!previewMode && importResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Import Complete
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {importResult.imported} imported, {importResult.skipped} skipped
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Some locations had issues:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>...and {importResult.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setUrl("")
              setLocations([])
              setStats(null)
              setImportResult(null)
              setSelectedIndices(new Set())
            }}
          >
            Import Another List
          </Button>
        </div>
      )}
    </div>
  )
}
