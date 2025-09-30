import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SummaryWhere {
  date: {
    gte: Date
    lte: Date
  }
  consumer?: {
    name: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly' // weekly, monthly, custom, all
    const consumerName = searchParams.get('consumerName')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const effectiveEnd = endDateParam ? new Date(endDateParam) : new Date()
    let startDate: Date | null = null

    if (period === 'weekly') {
      startDate = new Date(effectiveEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'monthly') {
      startDate = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 1)
    } else if (period === 'custom') {
      startDate = startDateParam ? new Date(startDateParam) : null
    } else if (period === 'all') {
      startDate = null
    }

    const where: any = {}
    // Make the upper bound exclusive to avoid timezone off-by-one-day issues
    const endExclusive = new Date(effectiveEnd)
    endExclusive.setDate(endExclusive.getDate() + 1)
    if (startDate) {
      where.date = {
        gte: startDate,
        lt: endExclusive
      }
    } else if (period !== 'custom' && period !== 'monthly' && period !== 'weekly') {
      // 'all' case: no date filter
    } else {
      // if custom without valid dates, default to last 30 days to avoid huge queries
      const fallbackStart = new Date(effectiveEnd.getTime() - 30 * 24 * 60 * 60 * 1000)
      where.date = { gte: fallbackStart, lt: endExclusive }
    }

    if (consumerName && consumerName !== 'all') {
      where.consumer = {
        name: consumerName
      }
    }

    // Get total by consumer using aggregation with include
    const billsWithConsumer = await prisma.bill.findMany({
      where,
      include: {
        consumer: true
      }
    })

    // Group by consumer manually
    const consumerMap = new Map()
    billsWithConsumer.forEach(bill => {
      const consumerName = bill.consumer.name
      if (!consumerMap.has(consumerName)) {
        consumerMap.set(consumerName, {
          consumerName,
          _sum: { amount: 0 },
          _count: { id: 0 }
        })
      }
      const consumer = consumerMap.get(consumerName)
      consumer._sum.amount += bill.amount.toNumber()
      consumer._count.id += 1
    })

    const totalByConsumer = Array.from(consumerMap.values())

    // Get total by meal type
    const totalByMealType = await prisma.bill.groupBy({
      by: ['mealType'],
      where,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get daily totals for chart using Prisma aggregation
    const dailyTotalsRaw = await prisma.bill.groupBy({
      by: ['date'],
      where,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Transform daily totals to match expected format
    const dailyTotals = dailyTotalsRaw.map(item => ({
      date: item.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      total: item._sum.amount?.toNumber() || 0,
      count: item._count.id
    }))

    const grandTotal = totalByConsumer.reduce((sum, item) => {
      return sum + (item._sum.amount || 0)
    }, 0)

    // Convert Decimal objects to numbers in the response
    const totalByConsumerConverted = totalByConsumer.map(item => ({
      consumerName: item.consumerName,
      _sum: {
        amount: item._sum.amount || 0
      },
      _count: item._count
    }))

    const totalByMealTypeConverted = totalByMealType.map(item => ({
      mealType: item.mealType,
      _sum: {
        amount: item._sum.amount?.toNumber() || 0
      },
      _count: item._count
    }))

    return NextResponse.json({
      totalByConsumer: totalByConsumerConverted,
      totalByMealType: totalByMealTypeConverted,
      dailyTotals,
      grandTotal,
      period,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: effectiveEnd.toISOString()
    })
  } catch (error) {
    console.error('Error fetching summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}
