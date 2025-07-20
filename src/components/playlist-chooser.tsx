"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { playlistChooser, type PlaylistRecommendation } from "@/ai/flows/playlist-chooser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ExternalLink, Info, Wand2 } from "lucide-react"
import Image from "next/image"
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const formSchema = z.object({
  mood: z.string().min(2, {
    message: "Mood must be at least 2 characters.",
  }),
})

function HowItWorksDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How We Select Your Playlists</DialogTitle>
          <DialogDescription>
            We use a blend of smart sampling and AI analysis to find the perfect vibe.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-foreground">Step 1: Playlist Filtering</h3>
            <p className="text-muted-foreground">If you have more than 15 playlists, we use AI to identify the top 15 contenders based on your mood, so we can focus on the most relevant options.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Step 2: Song Sampling</h3>
            <p className="text-muted-foreground">We take a random sample of up to 30 songs from each contender playlist. This gives us a good musical snapshot without being overwhelming.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Step 3: AI Vibe Check</h3>
            <p className="text-muted-foreground">Our AI analyzes the sampled songs and ranks them based on how well they match the vibe you've described.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Step 4: Playlist Scoring</h3>
            <p className="text-muted-foreground">We identify the top 30 songs from the AI's ranking—these are your "top hits" for the mood. We then rank your playlists based on how many of these top hits they contain.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Step 5: Final Recommendation</h3>
            <p className="text-muted-foreground">You get the top 3 playlists, complete with an explanation of how many "top hit" songs were found in each one.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PlaylistChooser() {
  const [recommendations, setRecommendations] = useState<PlaylistRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setRecommendations([])
    try {
      const result = await playlistChooser({ mood: values.mood })
      setRecommendations(result.recommendations)
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "There was a problem with the AI. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Playlist Chooser
            <HowItWorksDialog />
          </CardTitle>
          <CardDescription>Tell us your vibe, and we'll find the perfect playlist for you from your library.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's your vibe?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., chill, energetic, melancholic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Find Playlists
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
         <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Analyzing your playlists... this might take a moment.</p>
         </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <CardHeader className="px-0">
            <CardTitle>Your Playlist Recommendations</CardTitle>
            <CardDescription>Here are the top 3 playlists that match your mood.</CardDescription>
          </CardHeader>
          <div className="grid gap-6">
              {recommendations.map((rec, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="flex gap-4">
                    <Image 
                      src={rec.albumArt || 'https://placehold.co/128x128.png'} 
                      alt={`Cover for ${rec.name}`}
                      data-ai-hint="playlist music"
                      width={128} 
                      height={128}
                      className="object-cover w-32 h-32" 
                    />
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold">{rec.name}</h3>
                        <a href={rec.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 flex-1">{rec.explanation}</p>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        {rec.dateCreated && <div>Created: {format(new Date(rec.dateCreated), 'yyyy')}</div>}
                        {rec.lastModified && <div>Modified: {format(new Date(rec.lastModified), 'MMM yyyy')}</div>}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
