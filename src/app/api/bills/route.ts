import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MealType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const consumerName = searchParams.get('consumerName')
    const mealType = searchParams.get('mealType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (consumerName && consumerName !== 'all') {
      where.consumer = {
        name: consumerName
      }
    }

    if (mealType && mealType !== 'all') {
      where.mealType = mealType as MealType
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        consumer: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { consumerId, mealType, amount, date } = body

    // Validate required fields
    if (!consumerId || !mealType || !amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify consumer exists
    const consumer = await prisma.consumer.findUnique({
      where: { id: consumerId }
    })

    if (!consumer) {
      return NextResponse.json(
        { error: 'Consumer not found' },
        { status: 400 }
      )
    }

    const bill = await prisma.bill.create({
      data: {
        consumerId,
        mealType: mealType as MealType,
        amount: parseFloat(amount),
        date: new Date(date)
      },
      include: {
        consumer: true
      }
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    )
  }
}
