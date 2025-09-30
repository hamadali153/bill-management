'use client'

import { useState } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns'
import { FileText, FileSpreadsheet, Calendar as CalendarIcon } from 'lucide-react'
import * as Papa from 'papaparse'
import jsPDF from 'jspdf'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Bill {
  id: string
  consumerName: string
  mealType: string
  amount: number
  date: string
  createdAt: string
  updatedAt: string
}

interface Consumer { id: string; name: string }

type ApiBill = {
  id?: unknown
  consumer?: { name?: unknown } | null
  consumerName?: unknown
  mealType?: unknown
  amount?: unknown
  date?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0)
}

export default function ExportSection() {
  const [selectedConsumer, setSelectedConsumer] = useState('all')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isExporting, setIsExporting] = useState(false)
  const [dateRangeType, setDateRangeType] = useState<'all' | 'today' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'>('all')
  const [consumers, setConsumers] = useState<Consumer[]>([])

  // Load consumers from API to match exact names used in DB
  // so filtering by consumer returns results
  if (typeof window !== 'undefined' && consumers.length === 0) {
    fetch('/api/consumers')
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown) => {
        const list = Array.isArray(data) ? (data as Array<{ id: unknown; name: unknown }>) : []
        setConsumers(list.map((c) => ({ id: asString(c.id), name: asString(c.name) })))
      })
      .catch(() => {})
  }

  const applyPresetRange = (preset: typeof dateRangeType) => {
    const today = new Date()
    switch (preset) {
      case 'today':
        setStartDate(today)
        setEndDate(today)
        break
      case 'thisWeek': {
        const s = startOfWeek(today, { weekStartsOn: 1 })
        const e = endOfWeek(today, { weekStartsOn: 1 })
        setStartDate(s)
        setEndDate(e)
        break
      }
      case 'lastWeek': {
        const lastWeekDate = subWeeks(today, 1)
        const s = startOfWeek(lastWeekDate, { weekStartsOn: 1 })
        const e = endOfWeek(lastWeekDate, { weekStartsOn: 1 })
        setStartDate(s)
        setEndDate(e)
        break
      }
      case 'thisMonth': {
        setStartDate(startOfMonth(today))
        setEndDate(endOfMonth(today))
        break
      }
      case 'lastMonth': {
        const lastMonthDate = subMonths(today, 1)
        setStartDate(startOfMonth(lastMonthDate))
        setEndDate(endOfMonth(lastMonthDate))
        break
      }
      case 'all':
        setStartDate(undefined)
        setEndDate(undefined)
        break
      case 'custom':
      default:
        // Do not change dates; user will pick manually
        break
    }
  }

  const fetchBillsForExport = async (): Promise<Bill[]> => {
    const params = new URLSearchParams()

    if (selectedConsumer !== 'all') {
      params.append('consumerName', selectedConsumer)
    }

    if (startDate) {
      params.append('startDate', `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`)
    }

    if (endDate) {
      params.append('endDate', `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`)
    }

    const response = await fetch(`/api/bills?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch bills')

    const data: unknown = await response.json()
    // Normalize API response to the Bill shape this component expects
    const list: ApiBill[] = Array.isArray(data) ? (data as ApiBill[]) : []
    return list.map((b): Bill => ({
      id: asString(b.id),
      consumerName: asString(b.consumer?.name ?? b.consumerName ?? ''),
      mealType: asString(b.mealType),
      amount: asNumber(b.amount),
      date: asString(b.date),
      createdAt: asString(b.createdAt),
      updatedAt: asString(b.updatedAt),
    }))
  }

  const calculateSubtotals = (bills: Bill[]) => {
    type MealKey = 'BREAKFAST' | 'LUNCH' | 'DINNER'
    const subtotals = bills.reduce((acc, bill) => {
      if (!acc[bill.consumerName]) {
        acc[bill.consumerName] = {
          total: 0,
          count: 0,
          breakdown: { BREAKFAST: 0, LUNCH: 0, DINNER: 0 }
        }
      }
      acc[bill.consumerName].total += Number(bill.amount)
      acc[bill.consumerName].count += 1
      const mealKey = (bill.mealType as MealKey)
      if (mealKey in acc[bill.consumerName].breakdown) {
        acc[bill.consumerName].breakdown[mealKey as MealKey] += Number(bill.amount)
      }
      return acc
    }, {} as Record<string, { total: number; count: number; breakdown: Record<string, number> }>)

    const grandTotal = Object.values(subtotals).reduce((sum, consumer) => sum + consumer.total, 0)
    const totalBills = Object.values(subtotals).reduce((sum, consumer) => sum + consumer.count, 0)

    return { subtotals, grandTotal, totalBills }
  }

  const exportToCSV = async () => {
    setIsExporting(true)
    try {
      const bills = await fetchBillsForExport()
      const { subtotals, grandTotal } = calculateSubtotals(bills)

      // Prepare CSV data
      const csvData = []

      // Add header information
      csvData.push(['Bill Management System Export'])
      csvData.push(['Export Date:', format(new Date(), 'PPP')])
      csvData.push(['Consumer Filter:', selectedConsumer === 'all' ? 'All Consumers' : selectedConsumer])
      if (startDate || endDate) {
        csvData.push(['Date Range:', `${startDate ? format(startDate, 'PPP') : 'Start'} - ${endDate ? format(endDate, 'PPP') : 'End'}`])
      }
      csvData.push([]) // Empty row

      // Add bill details
      csvData.push(['Consumer', 'Meal Type', 'Amount', 'Date'])
      bills.forEach(bill => {
        csvData.push([
          bill.consumerName,
          bill.mealType.toLowerCase(),
          `RS ${Number(bill.amount).toFixed(2)}`,
          format(new Date(bill.date), 'MMM dd, yyyy')
        ])
      })

      // Add summary section
      csvData.push([]) // Empty row
      csvData.push(['SUMMARY'])
      csvData.push(['Consumer', 'Total Amount', 'Bill Count', 'Breakfast', 'Lunch', 'Dinner'])

      Object.entries(subtotals).forEach(([consumer, data]) => {
        csvData.push([
          consumer,
          `RS ${data.total.toFixed(2)}`,
          data.count.toString(),
          `RS ${data.breakdown.BREAKFAST.toFixed(2)}`,
          `RS ${data.breakdown.LUNCH.toFixed(2)}`,
          `RS ${data.breakdown.DINNER.toFixed(2)}`
        ])
      })

      csvData.push([]) // Empty row
      csvData.push(['GRAND TOTAL', `RS ${grandTotal.toFixed(2)}`, bills.length.toString()])

      // Convert to CSV and download
      const csv = Papa.unparse(csvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `bills-export-${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      alert('Failed to export to CSV')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const bills = await fetchBillsForExport()
      const { subtotals, grandTotal } = calculateSubtotals(bills)

      const pdf = new jsPDF()
      let yPosition = 20

      // Title
      pdf.setFontSize(20)
      pdf.text('Bill Management System Report', 20, yPosition)
      yPosition += 15

      // Export info
      pdf.setFontSize(10)
      pdf.text(`Export Date: ${format(new Date(), 'PPP')}`, 20, yPosition)
      yPosition += 7
      pdf.text(`Consumer Filter: ${selectedConsumer === 'all' ? 'All Consumers' : selectedConsumer}`, 20, yPosition)
      yPosition += 7

      if (startDate || endDate) {
        pdf.text(`Date Range: ${startDate ? format(startDate, 'PPP') : 'Start'} - ${endDate ? format(endDate, 'PPP') : 'End'}`, 20, yPosition)
        yPosition += 7
      }
      yPosition += 10

      // Bills table header
      pdf.setFontSize(12)
      pdf.text('Bills Details', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(8)
      pdf.text('Consumer', 20, yPosition)
      pdf.text('Meal Type', 60, yPosition)
      pdf.text('Amount', 100, yPosition)
      pdf.text('Date', 140, yPosition)
      yPosition += 7

      // Bills data
      bills.forEach(bill => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.text(bill.consumerName, 20, yPosition)
        pdf.text(bill.mealType.toLowerCase(), 60, yPosition)
        pdf.text(`RS ${Number(bill.amount).toFixed(2)}`, 100, yPosition)
        pdf.text(format(new Date(bill.date), 'MMM dd, yyyy'), 140, yPosition)
        yPosition += 5
      })

      // Summary section
      yPosition += 10
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(12)
      pdf.text('Summary by Consumer', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(8)
      pdf.text('Consumer', 20, yPosition)
      pdf.text('Total', 60, yPosition)
      pdf.text('Bills', 90, yPosition)
      pdf.text('Breakfast', 120, yPosition)
      pdf.text('Lunch', 150, yPosition)
      pdf.text('Dinner', 180, yPosition)
      yPosition += 7

      Object.entries(subtotals).forEach(([consumer, data]) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.text(consumer, 20, yPosition)
        pdf.text(`RS ${data.total.toFixed(2)}`, 60, yPosition)
        pdf.text(data.count.toString(), 90, yPosition)
        pdf.text(`RS ${data.breakdown.BREAKFAST.toFixed(2)}`, 120, yPosition)
        pdf.text(`RS ${data.breakdown.LUNCH.toFixed(2)}`, 150, yPosition)
        pdf.text(`RS ${data.breakdown.DINNER.toFixed(2)}`, 180, yPosition)
        yPosition += 5
      })

      // Grand total
      yPosition += 10
      pdf.setFontSize(10)
      pdf.text(`GRAND TOTAL: RS ${grandTotal.toFixed(2)} (${bills.length} bills)`, 20, yPosition)

      // Save PDF
      pdf.save(`bills-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Failed to export to PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Bills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Consumer</Label>
            <Select value={selectedConsumer} onValueChange={setSelectedConsumer}>
              <SelectTrigger>
                <SelectValue placeholder="Select consumer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Consumers</SelectItem>
                {consumers.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select
              value={dateRangeType}
              onValueChange={(v) => {
                const preset = v as typeof dateRangeType
                setDateRangeType(preset)
                applyPresetRange(preset)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                  disabled={dateRangeType !== 'custom'}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => setStartDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                  disabled={dateRangeType !== 'custom'}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Pick end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => setEndDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={exportToCSV}
            disabled={isExporting}
            className="flex-1"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export to CSV'}
          </Button>

          <Button
            onClick={exportToPDF}
            disabled={isExporting}
            variant="outline"
            className="flex-1"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export to PDF'}
          </Button>
        </div>

        {/* Export Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• CSV export includes detailed bills and consumer subtotals</p>
          <p>• PDF export provides a formatted report with summary breakdown</p>
          <p>• Filter by consumer to get individual reports or select &quot;All&quot; for complete summary</p>
        </div>
      </CardContent>
    </Card>
  )
}
