'use client'

import { useState, useEffect } from 'react'
import { Edit, Trash2, UserPlus, Eye, EyeOff } from 'lucide-react'

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
import ConsumerForm from './ConsumerForm'

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

const STATUS_FILTERS = [
  { value: 'all', label: 'All Consumers' },
  { value: 'active', label: 'Active Only' },
  { value: 'inactive', label: 'Inactive Only' },
]

export default function ConsumerList() {
  const [consumers, setConsumers] = useState<Consumer[]>([])
  const [filteredConsumers, setFilteredConsumers] = useState<Consumer[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingConsumer, setEditingConsumer] = useState<Consumer | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const fetchConsumers = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter === 'active') {
        params.append('isActive', 'true')
      } else if (statusFilter === 'inactive') {
        params.append('isActive', 'false')
      }

      const response = await fetch(`/api/consumers?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch consumers')

      const data = await response.json()
      setConsumers(data)
      setFilteredConsumers(data)
    } catch (error) {
      console.error('Error fetching consumers:', error)
      alert('Failed to fetch consumers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsumers()
  }, [statusFilter])

  const handleEdit = (consumer: Consumer) => {
    setEditingConsumer(consumer)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (consumerId: string) => {
    if (!confirm('Are you sure you want to delete this consumer? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/consumers/${consumerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete consumer')
      }

      fetchConsumers() // Refresh the list
    } catch (error) {
      console.error('Error deleting consumer:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete consumer')
    }
  }

  const handleToggleStatus = async (consumer: Consumer) => {
    try {
      const response = await fetch(`/api/consumers/${consumer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: consumer.name,
          email: consumer.email,
          phone: consumer.phone,
          isActive: !consumer.isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update consumer')
      }

      fetchConsumers() // Refresh the list
    } catch (error) {
      console.error('Error updating consumer:', error)
      alert(error instanceof Error ? error.message : 'Failed to update consumer')
    }
  }

  const handleEditSubmit = () => {
    setIsEditDialogOpen(false)
    setEditingConsumer(null)
    fetchConsumers() // Refresh the list
  }

  const handleAddSubmit = () => {
    setIsAddDialogOpen(false)
    fetchConsumers() // Refresh the list
  }

  const totalConsumers = filteredConsumers.length
  const activeConsumers = filteredConsumers.filter(c => c.isActive).length
  const totalBills = filteredConsumers.reduce((sum, consumer) => sum + (consumer._count?.bills || 0), 0)

  if (loading) {
    return <div className="text-center py-4">Loading consumers...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <CardTitle>Consumer Management</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Consumer
            </Button>
          </div>
        </div>

        {filteredConsumers.length > 0 && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              Total: <span className="font-semibold text-foreground">{totalConsumers}</span> consumers
              ({activeConsumers} active, {totalConsumers - activeConsumers} inactive)
            </div>
            <div>
              Total Bills: <span className="font-semibold text-foreground">{totalBills}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredConsumers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No consumers found. {statusFilter !== 'all' ? 'Try adjusting your filter.' : 'Add your first consumer!'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bills</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsumers.map((consumer) => (
                  <TableRow key={consumer.id}>
                    <TableCell className="font-medium">{consumer.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {consumer.email && (
                          <div className="text-sm text-muted-foreground">{consumer.email}</div>
                        )}
                        {consumer.phone && (
                          <div className="text-sm text-muted-foreground">{consumer.phone}</div>
                        )}
                        {!consumer.email && !consumer.phone && (
                          <div className="text-sm text-muted-foreground italic">No contact info</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={consumer.isActive ? 'default' : 'secondary'}>
                        {consumer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {consumer._count?.bills || 0} bills
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(consumer.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleStatus(consumer)}
                          title={consumer.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {consumer.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(consumer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(consumer.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={consumer._count?.bills && consumer._count.bills > 0}
                          title={
                            consumer._count?.bills && consumer._count.bills > 0
                              ? 'Cannot delete consumer with bills'
                              : 'Delete consumer'
                          }
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

        {/* Add Consumer Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Consumer</DialogTitle>
            </DialogHeader>
            <ConsumerForm
              onSubmit={handleAddSubmit}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Consumer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Consumer</DialogTitle>
            </DialogHeader>
            {editingConsumer && (
              <ConsumerForm
                initialData={editingConsumer}
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
