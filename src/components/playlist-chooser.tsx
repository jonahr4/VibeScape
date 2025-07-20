"use client"

import React, { useState, useCallback } from "react"
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
import { cn } from "@/lib/utils"

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

const progressSteps = [
  { id: 1, name: "Filtering Playlists" },
  { id: 2, name: "Sampling Songs" },
  { id: 3, name: "AI Ranking" },
  { id: 4, name: "Scoring Playlists" },
  { id: 5, name: "Finalizing" },
];

function ProgressTracker({ currentStep, description }: { currentStep: number, description: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {progressSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300",
                  currentStep > step.id ? "bg-primary text-primary-foreground" :
                  currentStep === step.id ? "bg-primary text-primary-foreground animate-pulse-bg" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? '✔' : step.id}
              </div>
              <p className="text-xs mt-1 text-center">{step.name}</p>
            </div>
            {index < progressSteps.length - 1 && <div className="flex-1 h-1 bg-border mx-2"></div>}
          </React.Fragment>
        ))}
      </div>
      <div className="text-center text-muted-foreground p-2 bg-muted/50 rounded-md">
        <p>{description}</p>
      </div>
    </div>
  )
}


export default function PlaylistChooser() {
  const [recommendations, setRecommendations] = useState<PlaylistRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [progress, setProgress] = useState({ step: 0, description: "" });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: "",
    },
  })

  const handleProgress = useCallback((step: number, description: string) => {
    setProgress({ step, description });
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setRecommendations([])
    setProgress({ step: 1, description: "Getting started..." });
    try {
      const result = await playlistChooser({ mood: values.mood, progressCallback: handleProgress })
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
      setProgress({ step: 0, description: "" });
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
         <div className="p-4 border rounded-lg">
            <ProgressTracker currentStep={progress.step} description={progress.description} />
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
