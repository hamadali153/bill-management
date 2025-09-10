'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const consumerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
})

type ConsumerFormData = z.infer<typeof consumerSchema>

interface Consumer {
  id: string
  name: string
  email?: string
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    bills: number
  }
}

interface ConsumerFormProps {
  onSubmit: () => void
  initialData?: Consumer
  isEditing?: boolean
}

export default function ConsumerForm({ onSubmit, initialData, isEditing = false }: ConsumerFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingData, setPendingData] = useState<ConsumerFormData | null>(null)

  const form = useForm<ConsumerFormData>({
    resolver: zodResolver(consumerSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          email: initialData.email || '',
          phone: initialData.phone || '',
          isActive: initialData.isActive,
        }
      : {
          name: '',
          email: '',
          phone: '',
          isActive: true,
        },
  })

  const handleFormSubmit = (data: ConsumerFormData) => {
    setPendingData(data)
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = async () => {
    if (!pendingData) return

    setIsLoading(true)
    setShowConfirmation(false)

    try {
      const url = isEditing ? `/api/consumers/${initialData?.id}` : '/api/consumers'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: pendingData.name,
          email: pendingData.email || null,
          phone: pendingData.phone || null,
          isActive: pendingData.isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save consumer')
      }

      // Reset form if adding new consumer
      if (!isEditing) {
        form.reset()
      }

      onSubmit()
      setPendingData(null)
    } catch (error) {
      console.error('Error saving consumer:', error)
      alert(error instanceof Error ? error.message : 'Failed to save consumer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setPendingData(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Consumer' : 'Add New Consumer'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter consumer name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter phone number (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Active consumers can be selected when creating bills
                    </div>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Saving...' : isEditing ? 'Update Consumer' : 'Add Consumer'}
            </Button>
          </form>
        </Form>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Consumer Details</DialogTitle>
            <DialogDescription>
              Please review the consumer details before submitting.
            </DialogDescription>
          </DialogHeader>

          {pendingData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-sm font-semibold">{pendingData.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <p className="text-sm font-semibold">
                    {pendingData.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                {pendingData.email && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-sm font-semibold">{pendingData.email}</p>
                  </div>
                )}
                {pendingData.phone && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-sm font-semibold">{pendingData.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelConfirmation}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Confirm & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
