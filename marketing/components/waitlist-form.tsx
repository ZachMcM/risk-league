"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2 } from "lucide-react"
import { useWaitlist } from "@/hooks/use-waitlist"

interface WaitlistFormProps {
  className?: string
  placeholder?: string
  buttonText?: string
  size?: "default" | "lg"
}

export function WaitlistForm({ 
  className,
  placeholder = "Enter your email",
  buttonText = "Join Waitlist",
  size = "default"
}: WaitlistFormProps) {
  const { form, onSubmit, isSubmitting } = useWaitlist()

  return (
    <form onSubmit={onSubmit} className={cn("w-full max-w-md space-y-4", className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            {...form.register('email')}
            type="email"
            placeholder={placeholder}
            className={cn(
              "text-base transition-all duration-200",
              size === "lg" && "h-12",
              form.formState.errors.email && "border-destructive",
              "focus:scale-[1.02] focus:shadow-lg"
            )}
            disabled={isSubmitting}
          />
        </div>
        <Button
          type="submit"
          size={size}
          className={cn(
            "bg-primary hover:bg-primary/90 transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            size === "lg" && "h-12 px-6"
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
      
      {form.formState.errors.email && (
        <p className="text-sm text-destructive animate-in slide-in-from-top-2 duration-300">
          {form.formState.errors.email.message}
        </p>
      )}
    </form>
  )
}