'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Calendar, DollarSign, Users, Utensils } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SummaryData {
  totalByConsumer: Array<{
    consumerName: string
    _sum: { amount: number | null }
    _count: { id: number }
  }>
  totalByMealType: Array<{
    mealType: string
    _sum: { amount: number | null }
    _count: { id: number }
  }>
  dailyTotals: Array<{
    date: string
    total: number
    count: number
  }>
  grandTotal: number
  period: string
  startDate: string
  endDate: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Dashboard() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [consumers, setConsumers] = useState<Array<{id: string, name: string}>>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [selectedConsumer, setSelectedConsumer] = useState('all')

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

  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.append('period', selectedPeriod)
      if (selectedConsumer !== 'all') {
        params.append('consumerName', selectedConsumer)
      }

      const response = await fetch(`/api/bills/summary?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch summary')

      const data = await response.json()
      setSummaryData(data)
    } catch (error) {
      console.error('Error fetching summary:', error)
      alert('Failed to fetch summary data')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedConsumer])

  useEffect(() => {
    fetchConsumers()
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  if (!summaryData) {
    return <div className="text-center py-8">No data available</div>
  }

  const consumerChartData = summaryData.totalByConsumer.map(item => ({
    name: item.consumerName,
    amount: item._sum.amount || 0,
    count: item._count.id
  }))

  const mealTypeChartData = summaryData.totalByMealType.map(item => ({
    name: item.mealType.toLowerCase(),
    amount: item._sum.amount || 0,
    count: item._count.id
  }))

  const totalBills = summaryData.totalByConsumer.reduce((sum, item) => sum + item._count.id, 0)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedConsumer} onValueChange={setSelectedConsumer}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Select consumer" />
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RS {summaryData.grandTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'weekly' ? 'This week' : 'This month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBills}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Bill</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              RS {totalBills > 0 ? (summaryData.grandTotal / totalBills).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Consumers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalByConsumer.length}</div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumer Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Consumer</CardTitle>
          </CardHeader>
          <CardContent>
            {consumerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={consumerChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`RS ${Number(value).toFixed(2)}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Meal Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {mealTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mealTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: RS ${Number(value).toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {mealTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`RS ${Number(value).toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consumer Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Consumer Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summaryData.totalByConsumer.map((consumer, index) => (
              <div key={consumer.consumerName} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="font-medium">{consumer.consumerName}</span>
                  <Badge variant="secondary">{consumer._count.id} bills</Badge>
                </div>
                <div className="text-lg font-semibold">
                  RS {(consumer._sum.amount || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
