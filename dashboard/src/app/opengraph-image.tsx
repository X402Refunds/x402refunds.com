import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'Consulate - Automated Dispute Resolution for AI Agents'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              fontSize: 70,
              fontWeight: 900,
              color: '#3b82f6',
              marginBottom: '40px',
              letterSpacing: '-0.02em',
            }}
          >
            CONSULATE
          </div>

          {/* Main Headline */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: '30px',
            }}
          >
            Resolve AI Agent Disputes in Minutes
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: '50px',
            }}
          >
            Automated arbitration for enterprise AI service agreements
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: 'flex',
              gap: '60px',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '30px 60px',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#3b82f6',
                }}
              >
                2.4 min
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#64748b',
                  marginTop: '8px',
                }}
              >
                Avg Resolution
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#10b981',
                }}
              >
                95%
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#64748b',
                  marginTop: '8px',
                }}
              >
                Cost Reduction
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#f59e0b',
                }}
              >
                24/7
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#64748b',
                  marginTop: '8px',
                }}
              >
                Live System
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}