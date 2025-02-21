import Image from "next/image"
import { ThumbsUp, MapPin, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CafeCardProps {
  title: string
  description: string
  image: string
  locations: number
  contributors: number
  upvotes: number
  username: string
}

export function CafeCard({ title, description, image, locations, contributors, upvotes, username }: CafeCardProps) {
  return (
    <Card className="w-full transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="flex flex-col items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{upvotes}</span>
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold text-xl leading-none tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="relative h-20 w-20 rounded-md overflow-hidden">
          <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4" />
            {locations} locations
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-1 h-4 w-4" />
            {contributors} contributors
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>IS</AvatarFallback>
          </Avatar>
          Started by {username}
        </div>
      </CardFooter>
    </Card>
  )
}

