'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const billSchema = z.object({
  consumerId: z.string().min(1, 'Consumer is required'),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER'], {
    message: 'Meal type is required',
  }),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  date: z.date({
    message: 'Date is required',
  }),
})

type BillFormData = z.infer<typeof billSchema>

interface Consumer {
  id: string
  name: string
  email?: string
  phone?: string
  isActive: boolean
}

interface BillData {
  id: string
  consumerId: string
  consumer?: Consumer
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER'
  amount: number
  date: string
}

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
]

interface BillFormProps {
  onSubmit: () => void
  initialData?: BillData
  isEditing?: boolean
}

export default function BillForm({ onSubmit, initialData, isEditing = false }: BillFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingData, setPendingData] = useState<BillFormData | null>(null)
  const [consumers, setConsumers] = useState<Consumer[]>([])

  const form = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: initialData
      ? {
          consumerId: initialData.consumerId || initialData.consumer?.id || '',
          mealType: initialData.mealType,
          amount: initialData.amount.toString(),
          date: new Date(initialData.date),
        }
      : {
          consumerId: '',
          mealType: undefined,
          amount: '',
          date: new Date(),
        },
  })

  // Fetch consumers on component mount
  useEffect(() => {
    const fetchConsumers = async () => {
      try {
        const response = await fetch('/api/consumers?isActive=true')
        if (response.ok) {
          const data = await response.json()
          setConsumers(data)
        }
      } catch (error) {
        console.error('Error fetching consumers:', error)
      }
    }

    fetchConsumers()
  }, [])

  const handleFormSubmit = (data: BillFormData) => {
    console.log('Form submitted with data:', data)
    console.log('Date value:', data.date)
    console.log('Date type:', typeof data.date)
    setPendingData(data)
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = async () => {
    if (!pendingData) return

    setIsLoading(true)
    setShowConfirmation(false)

    try {
      const url = isEditing ? `/api/bills/${initialData?.id}` : '/api/bills'
      const method = isEditing ? 'PUT' : 'POST'

      const dateString = `${pendingData.date.getFullYear()}-${String(pendingData.date.getMonth() + 1).padStart(2, '0')}-${String(pendingData.date.getDate()).padStart(2, '0')}`
      
      // Debug logging
      console.log('Original date from picker:', pendingData.date)
      console.log('Date components:', {
        year: pendingData.date.getFullYear(),
        month: pendingData.date.getMonth() + 1,
        day: pendingData.date.getDate()
      })
      console.log('Date string being sent:', dateString)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumerId: pendingData.consumerId,
          mealType: pendingData.mealType,
          amount: parseFloat(pendingData.amount),
          date: dateString,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save bill')
      }

      // Reset form if adding new bill
      if (!isEditing) {
        form.reset()
      }

      onSubmit()
      setPendingData(null)
    } catch (error) {
      console.error('Error saving bill:', error)
      alert('Failed to save bill. Please try again.')
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
        <CardTitle>{isEditing ? 'Edit Bill' : 'Add New Bill'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="consumerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select consumer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {consumers.map((consumer) => (
                        <SelectItem key={consumer.id} value={consumer.id}>
                          {consumer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEAL_TYPES.map((meal) => (
                        <SelectItem key={meal.value} value={meal.value}>
                          {meal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          console.log('Date selected:', date)
                          console.log('Date type:', typeof date)
                          field.onChange(date)
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Saving...' : isEditing ? 'Update Bill' : 'Add Bill'}
            </Button>
          </form>
        </Form>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Bill Details</DialogTitle>
            <DialogDescription>
              Please review the bill details before submitting.
            </DialogDescription>
          </DialogHeader>

          {pendingData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Consumer</Label>
                  <p className="text-sm font-semibold">
                    {consumers.find(c => c.id === pendingData.consumerId)?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Meal Type</Label>
                  <p className="text-sm font-semibold">
                    {MEAL_TYPES.find(m => m.value === pendingData.mealType)?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="text-sm font-semibold">RS {parseFloat(pendingData.amount).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="text-sm font-semibold">{format(pendingData.date, 'PPP')}</p>
                </div>
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
