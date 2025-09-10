import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Prisma.ConsumerWhereInput = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const consumers = await prisma.consumer.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            bills: true
          }
        }
      }
    })

    return NextResponse.json(consumers)
  } catch (error) {
    console.error('Error fetching consumers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consumers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, isActive = true } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if consumer with same name already exists
    const existingConsumer = await prisma.consumer.findUnique({
      where: { name }
    })

    if (existingConsumer) {
      return NextResponse.json(
        { error: 'Consumer with this name already exists' },
        { status: 400 }
      )
    }

    const consumer = await prisma.consumer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        isActive
      }
    })

    return NextResponse.json(consumer, { status: 201 })
  } catch (error) {
    console.error('Error creating consumer:', error)
    return NextResponse.json(
      { error: 'Failed to create consumer' },
      { status: 500 }
    )
  }
}
