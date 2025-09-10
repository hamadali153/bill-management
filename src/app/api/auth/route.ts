import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // Get password from environment variable, fallback to default
    const correctPassword = process.env.APP_PASS || '2197'
    
    if (password === correctPassword) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Incorrect password' 
      }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ 
      error: 'Invalid request',
      message: 'Please provide a valid password'
    }, { status: 400 })
  }
}
