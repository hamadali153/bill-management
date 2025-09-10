'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Edit, Trash2, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import BillForm from './BillForm'

interface Bill {
  id: string
  consumerId: string
  consumer: {
    id: string
    name: string
    email?: string
    phone?: string
    isActive: boolean
  }
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER'
  amount: number
  date: string
  createdAt: string
  updatedAt: string
}

const CONSUMERS = ['all']
const MEAL_TYPES = [
  { value: 'all', label: 'All Meals' },
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
]

const getMealBadgeColor = (mealType: string) => {
  switch (mealType) {
    case 'BREAKFAST':
      return 'bg-orange-100 text-orange-800'
    case 'LUNCH':
      return 'bg-blue-100 text-blue-800'
    case 'DINNER':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function BillsList() {
  const [bills, setBills] = useState<Bill[]>([])
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [consumers, setConsumers] = useState<Array<{id: string, name: string}>>([])
  const [loading, setLoading] = useState(true)
  const [selectedConsumer, setSelectedConsumer] = useState('all')
  const [selectedMealType, setSelectedMealType] = useState('all')
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const fetchConsumers = async () => {
    try {
      const response = await fetch('/api/consumers')
      if (response.ok) {
        const data = await response.json()
        setConsumers(data)
      }
    } catch (error) {
      console.error('Error fetching consumers:', error)
    }
  }

  const fetchBills = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedConsumer !== 'all') params.append('consumerName', selectedConsumer)
      if (selectedMealType !== 'all') params.append('mealType', selectedMealType)

      const response = await fetch(`/api/bills?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch bills')

      const data = await response.json()
      setBills(data)
      setFilteredBills(data)
    } catch (error) {
      console.error('Error fetching bills:', error)
      alert('Failed to fetch bills')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsumers()
  }, [])

  useEffect(() => {
    fetchBills()
  }, [selectedConsumer, selectedMealType])

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return

    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete bill')

      fetchBills() // Refresh the list
    } catch (error) {
      console.error('Error deleting bill:', error)
      alert('Failed to delete bill')
    }
  }

  const handleEditSubmit = () => {
    setIsEditDialogOpen(false)
    setEditingBill(null)
    fetchBills() // Refresh the list
  }

  const totalAmount = filteredBills.reduce((sum, bill) => sum + Number(bill.amount), 0)

  if (loading) {
    return <div className="text-center py-4">Loading bills...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <CardTitle>Bills History</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedConsumer} onValueChange={setSelectedConsumer}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by consumer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Consumers</SelectItem>
                {consumers.map((consumer) => (
                  <SelectItem key={consumer.id} value={consumer.name}>
                    {consumer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by meal" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((meal) => (
                  <SelectItem key={meal.value} value={meal.value}>
                    {meal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredBills.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">RS {totalAmount.toFixed(2)}</span>
            {' '}({filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'})
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredBills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No bills found. {selectedConsumer !== 'all' || selectedMealType !== 'all' ? 'Try adjusting your filters.' : 'Add your first bill!'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consumer</TableHead>
                  <TableHead>Meal</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.consumer.name}</TableCell>
                    <TableCell>
                      <Badge className={getMealBadgeColor(bill.mealType)}>
                        {bill.mealType.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>RS {Number(bill.amount).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(bill.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(bill)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(bill.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Bill</DialogTitle>
            </DialogHeader>
            {editingBill && (
              <BillForm
                initialData={editingBill}
                isEditing={true}
                onSubmit={handleEditSubmit}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
