import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MealType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bill = await prisma.bill.findUnique({
      where: {
        id: params.id,
      },
      include: {
        consumer: true
      }
    })

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(bill)
  } catch (error) {
    console.error('Error fetching bill:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const bill = await prisma.bill.update({
      where: { id: params.id },
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

    return NextResponse.json(bill)
  } catch (error) {
    console.error('Error updating bill:', error)
    return NextResponse.json(
      { error: 'Failed to update bill' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.bill.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Error deleting bill:', error)
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    )
  }
}
