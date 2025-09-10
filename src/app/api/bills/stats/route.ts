import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get total bills count
    const totalBills = await prisma.bill.count()

    // Get total amount
    const totalAmount = await prisma.bill.aggregate({
      _sum: {
        amount: true,
      },
    })

    // Get bills by meal type
    const billsByMealType = await prisma.bill.groupBy({
      by: ['mealType'],
      _count: {
        mealType: true,
      },
      _sum: {
        amount: true,
      },
    })

    // Get recent bills (last 10)
    const recentBills = await prisma.bill.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        consumerName: true,
        mealType: true,
        amount: true,
        date: true,
        createdAt: true,
      },
    })

    // Get daily totals for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyTotals = await prisma.bill.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        date: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    const stats = {
      totalBills,
      totalAmount: totalAmount._sum.amount || 0,
      billsByMealType: billsByMealType.map(item => ({
        mealType: item.mealType,
        count: item._count.mealType,
        totalAmount: item._sum.amount || 0,
      })),
      recentBills,
      dailyTotals: dailyTotals.map(item => ({
        date: item.date,
        totalAmount: item._sum.amount || 0,
        billCount: item._count.date,
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching bill statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bill statistics' },
      { status: 500 }
    )
  }
}
