import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Map, Clock, Star, MapPin as LocationIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { UserInfo } from "@/lib/hooks/useUserInfo"
import { Location, PlaceDetails } from "@/lib/hooks/useGoogleMaps"

interface LocationInfoWindowProps {
  location: Location
  userInfo: UserInfo
  placeDetails: PlaceDetails | null
  onClose: () => void
}

export default function LocationInfoWindow({
  location,
  userInfo,
  placeDetails,
  onClose,
}: LocationInfoWindowProps) {
  return (
    <div
      className="relative w-72 bg-white bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg popup-card border border-gray-100"
      style={{ marginTop: "-10px" }}
    >
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 z-10"
      >
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-2 truncate">
          {location.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage
              src={userInfo.profilePicture || "/placeholder.svg"}
            />
            <AvatarFallback>
              {userInfo.username
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            by {userInfo.username}
          </span>
        </div>
        
        {placeDetails?.imageUrl ? (
          <div className="mb-3">
            <Image
              src={placeDetails.imageUrl}
              alt={location.name}
              width={600}
              height={400}
              className="w-full h-36 object-cover rounded-md"
              priority
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic mb-3">
            No image available
          </p>
        )}
        
        <p className="text-sm text-foreground/90 leading-relaxed mb-3 bg-gray-50 p-2 rounded-md">
          {location.note || "No description available"}
        </p>
        
        {placeDetails && (
          <div className="text-sm text-muted-foreground mb-3 space-y-1.5">
            {placeDetails.rating && (
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{placeDetails.rating.toFixed(1)}/5</span>
              </div>
            )}
            
            {placeDetails.isOpenNow !== null && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span className={placeDetails.isOpenNow ? "text-green-600 font-medium" : "text-red-600"}>
                  {placeDetails.isOpenNow ? "Open Now" : "Closed Now"}
                </span>
              </div>
            )}
          </div>
        )}
        
        <Link
          href={location.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full bg-[#4285F4] text-white py-2 rounded-md text-sm font-medium hover:bg-[#357abd] transition-colors"
        >
          <Map className="w-4 h-4 mr-2" />
          Open in Google Maps
        </Link>
      </div>
    </div>
  )
} 