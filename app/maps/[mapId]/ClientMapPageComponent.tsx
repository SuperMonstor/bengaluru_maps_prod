"use client";

import { useState, useRef, useMemo } from "react";
import { Markdown } from "@/components/markdown-renderer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Users, ThumbsUp, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import ShareButton from "@/components/sharebutton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLoadScript } from "@react-google-maps/api";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { createClient } from "@/lib/supabase/service/client";

interface Location {
  id: string;
  map_id: string;
  creator_id: string;
  name: string;
  latitude: number;
  longitude: number;
  google_maps_url: string;
  note: string | null;
  created_at: string;
}

interface MapData {
  id: string;
  title: string;
  description: string;
  body: string;
  image: string;
  locations: Location[];
  contributors: number;
  upvotes: number;
  username: string;
  userProfilePicture: string | null;
}

interface ClientMapPageContentProps {
  map: MapData;
}

interface UserInfo {
  username: string;
  profilePicture: string | null;
}

export default function ClientMapPageContent({ map }: ClientMapPageContentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

	const supabase = createClient();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const center = useMemo(() => ({
    lat: 12.9542946, // Bengaluru center (adjust as needed)
    lng: 77.4908558,
  }), []);

  // Fetch user info when a location is selected
  const fetchUserInfo = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, picture_url")
        .eq("id", creatorId)
        .single();

      if (error) throw error;

      const username = `${data.first_name || "Unnamed"} ${data.last_name || "User"}`.trim();
      setUserInfo({
        username,
        profilePicture: data.picture_url || null,
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      setUserInfo({ username: "Unknown User", profilePicture: null });
    }
  };

  const handleCollapse = () => setIsOpen(false);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const onMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    fetchUserInfo(location.creator_id);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: location.latitude, lng: location.longitude });
    }
  };

  const handleMapClick = () => {
    setSelectedLocation(null); // Close InfoWindow when clicking elsewhere on the map
    if (isOpen) setIsOpen(false); // Close mobile panel if open
  };

  if (!isLoaded) {
    return (
      <main className="bg-gray-50/50 flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-8">Loading map...</div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50/50 flex flex-col">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-[calc(100vh-4rem)]">
        {/* Left Column: Scrollable Content (No Locations List) */}
        <div className="w-1/2 p-4 md:p-8 lg:p-12 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex-1">
              {map.title}
            </h1>
            <div className="flex items-center gap-2">
              <Link href={`/maps/${map.id}/submit-location`}>
                <Button variant="default" size="sm">Contribute</Button>
              </Link>
              <ShareButton mapId={map.id} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm line-clamp-2">
              {map.description}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-8 w-8 border border-border/50">
              <AvatarImage src={map.userProfilePicture || "/placeholder.svg"} />
              <AvatarFallback>
                {map.username.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>
              Started by <span className="font-medium">{map.username}</span>
            </span>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span><MapPin className="inline mr-1 h-4 w-4" />{map.locations.length} locations</span>
            <span><Users className="inline mr-1 h-4 w-4" />{map.contributors} contributors</span>
            <span><ThumbsUp className="inline mr-1 h-4 w-4" />{map.upvotes} upvotes</span>
          </div>
          <div className="relative w-full h-[200px] mt-6">
            <Image
              src={map.image}
              alt={map.title}
              fill
              className="object-cover rounded-md"
            />
          </div>
          <div className="mt-4">
            <Markdown content={map.body} />
          </div>
        </div>

        {/* Right Column: Full-height Map */}
        <div className="w-1/2">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={12}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {map.locations.map((location) => (
              <Marker
                key={location.id}
                position={{ lat: location.latitude, lng: location.longitude }}
                onClick={() => onMarkerClick(location)}
              />
            ))}
            {selectedLocation && userInfo && (
              <InfoWindow
                position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
                onCloseClick={() => setSelectedLocation(null)}
              >
                <div className="p-2 text-sm max-w-xs">
                  <p className="font-bold text-base">{selectedLocation.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6 border border-border/50">
                      <AvatarImage src={userInfo.profilePicture || "/placeholder.svg"} />
                      <AvatarFallback>
                        {userInfo.username.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">{userInfo.username}</span>
                  </div>
                  <p className="mt-2">{selectedLocation.note || "No description"}</p>
                  <Link
                    href={selectedLocation.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline mt-1 block"
                  >
                    Open on Google Maps
                  </Link>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden relative h-screen">
        <div className="absolute inset-0">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={12}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {map.locations.map((location) => (
              <Marker
                key={location.id}
                position={{ lat: location.latitude, lng: location.longitude }}
                onClick={() => onMarkerClick(location)}
              />
            ))}
            {selectedLocation && userInfo && (
              <InfoWindow
                position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
                onCloseClick={() => setSelectedLocation(null)}
              >
                <div className="p-2 text-sm max-w-xs">
                  <p className="font-bold text-base">{selectedLocation.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6 border border-border/50">
                      <AvatarImage src={userInfo.profilePicture || "/placeholder.svg"} />
                      <AvatarFallback>
                        {userInfo.username.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">{userInfo.username}</span>
                  </div>
                  <p className="mt-2">{selectedLocation.note || "No description"}</p>
                  <Link
                    href={selectedLocation.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline mt-1 block"
                  >
                    Open on Google Maps
                  </Link>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {/* Bottom Bar */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 cursor-pointer z-10"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold truncate flex-1">{map.title}</h2>
              <ChevronUp className={`h-6 w-6 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
            <p className="text-muted-foreground text-sm truncate">{map.description}</p>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span>Started by <span className="font-medium">{map.username}</span></span>
              <div className="flex gap-4">
                <span><MapPin className="inline mr-1 h-4 w-4" />{map.locations.length} locations</span>
                <span><Users className="inline mr-1 h-4 w-4" />{map.contributors} contributors</span>
                <span><ThumbsUp className="inline mr-1 h-4 w-4" />{map.upvotes} upvotes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sliding Panel (No Locations List) */}
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 transition-transform duration-300 ease-in-out transform ${
            isOpen ? "translate-y-0" : "translate-y-full"
          } max-h-[80vh] overflow-y-auto z-20`}
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-bold tracking-tight truncate flex-1">{map.title}</h1>
              <div className="flex items-center gap-2">
                <Link href={`/maps/${map.id}/submit-location`}>
                  <Button variant="default" size="sm">Contribute</Button>
                </Link>
                <ShareButton mapId={map.id} />
                <button
                  onClick={handleCollapse}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="Collapse panel"
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">{map.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-8 w-8 border border-border/50">
                <AvatarImage src={map.userProfilePicture || "/placeholder.svg"} />
                <AvatarFallback>
                  {map.username.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>Started by <span className="font-medium">{map.username}</span></span>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span><MapPin className="inline mr-1 h-4 w-4" />{map.locations.length} locations</span>
              <span><Users className="inline mr-1 h-4 w-4" />{map.contributors} contributors</span>
              <span><ThumbsUp className="inline mr-1 h-4 w-4" />{map.upvotes} upvotes</span>
            </div>
            <div className="relative w-full h-[180px] mt-4">
              <Image
                src={map.image}
                alt={map.title}
                fill
                className="object-cover rounded-md"
              />
            </div>
            <div className="mt-4">
              <Markdown content={map.body} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}