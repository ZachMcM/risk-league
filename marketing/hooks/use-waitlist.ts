"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createClient } from "@/supabase/client"
import { waitlistSchema, type WaitlistFormData } from "@/lib/validationSchemas"

export function useWaitlist() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('waitlist_entries')
        .insert([{ email: data.email }])

      if (error) {
        if (error.code === '23505') {
          toast.error("You're already on the waitlist!")
        } else {
          console.log(error)
          toast.error("Something went wrong. Please try again.")
        }
        return
      }

      toast.success("Welcome to the waitlist! 🎉", {
        description: "We'll notify you when Risk League launches."
      })
      
      form.reset()
    } catch (error) {
      console.error('Waitlist submission error:', error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting,
  }
}