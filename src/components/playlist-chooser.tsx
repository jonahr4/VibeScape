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
import { Loader2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const formSchema = z.object({
  mood: z.string().min(2, {
    message: "Mood must be at least 2 characters.",
  }),
})

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
          <CardTitle>AI Playlist Chooser</CardTitle>
          <CardDescription>Tell us your mood, and we'll find the perfect playlist for you from your library.</CardDescription>
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
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Find Playlists
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
         <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      )}

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Playlist Recommendations</CardTitle>
            <CardDescription>Here are the top 3 playlists that match your mood.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {recommendations.map((rec, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold text-left">
                    {index + 1}. {rec.playlistName}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{rec.explanation}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
