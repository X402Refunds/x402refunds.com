import { ImageResponse } from 'next/og'

// Image metadata  
export const runtime = 'edge'
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation - Apple touch icon with C monogram
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '120px',
            fontWeight: '700',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          C
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
