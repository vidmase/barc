import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// You should set this in your .env.local as GEMINI_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

async function extractTextFromImage(imageBase64: string): Promise<{ ocr_text: string, extracted_address: string | null }> {
  // Call Gemini 1.5 Flash API for OCR
  const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY
  const body = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64,
            },
          },
          { text: 'Extract the delivery address from this image. Only return the address, nothing else.' },
        ],
      },
    ],
  }
  const res = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  // Gemini returns the result in a nested structure
  const ocr_text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  // For now, treat the whole result as the extracted address
  return { ocr_text, extracted_address: ocr_text }
}

export async function POST(req: NextRequest) {
  try {
    const { barcode_value, image_base64 } = await req.json()
    if (!barcode_value || !image_base64) {
      return NextResponse.json({ error: 'Missing barcode or image' }, { status: 400 })
    }

    // 1. Call Gemini to extract address
    const { ocr_text, extracted_address } = await extractTextFromImage(image_base64)

    // 2. Optionally, upload the image to Supabase Storage (not implemented here)
    // For now, just store the base64 or skip image_url
    const image_url = null

    // 3. Save to Supabase
    const { data, error } = await supabase.from('scans').insert([
      {
        barcode_value,
        scanned_at: new Date().toISOString(),
        image_url,
        ocr_text,
        extracted_address,
      },
    ])
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 