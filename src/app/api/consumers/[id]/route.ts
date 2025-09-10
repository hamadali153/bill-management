import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const consumer = await prisma.consumer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bills: true
          }
        }
      }
    })

    if (!consumer) {
      return NextResponse.json(
        { error: 'Consumer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(consumer)
  } catch (error) {
    console.error('Error fetching consumer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consumer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, isActive } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if consumer with same name already exists (excluding current consumer)
    const existingConsumer = await prisma.consumer.findFirst({
      where: {
        name,
        id: { not: id }
      }
    })

    if (existingConsumer) {
      return NextResponse.json(
        { error: 'Consumer with this name already exists' },
        { status: 400 }
      )
    }

    const consumer = await prisma.consumer.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        isActive
      }
    })

    return NextResponse.json(consumer)
  } catch (error) {
    console.error('Error updating consumer:', error)
    return NextResponse.json(
      { error: 'Failed to update consumer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if consumer has bills
    const billsCount = await prisma.bill.count({
      where: { consumerId: id }
    })

    if (billsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete consumer with existing bills. Please deactivate instead.' },
        { status: 400 }
      )
    }

    await prisma.consumer.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Consumer deleted successfully' })
  } catch (error) {
    console.error('Error deleting consumer:', error)
    return NextResponse.json(
      { error: 'Failed to delete consumer' },
      { status: 500 }
    )
  }
}
