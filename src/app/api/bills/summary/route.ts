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
    const period = searchParams.get('period') || 'monthly' // weekly, monthly
    const consumerName = searchParams.get('consumerName')

    const now = new Date()
    let startDate: Date

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const where: SummaryWhere = {
      date: {
        gte: startDate,
        lte: now
      }
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
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    })
  } catch (error) {
    console.error('Error fetching summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}
