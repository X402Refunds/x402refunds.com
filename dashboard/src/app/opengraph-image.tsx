import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Consulate - Automated Dispute Resolution for AI Agents';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e293b',
          padding: '80px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '60px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#3b82f6',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
            }}
          >
            ⚖️
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            Consulate
          </div>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: '700',
            color: 'white',
            lineHeight: 1.2,
            margin: '0 0 32px 0',
            textAlign: 'center',
            maxWidth: '1000px',
            letterSpacing: '-0.02em',
          }}
        >
          Resolve AI Agent Disputes
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            lineHeight: 1.4,
            margin: '0 0 60px 0',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          Automated arbitration for enterprise AI vendors
        </p>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '60px',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                fontSize: '40px',
                fontWeight: '700',
                color: '#10b981',
              }}
            >
              2.4 min
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Avg Resolution
            </div>
          </div>

          <div
            style={{
              width: '2px',
              height: '60px',
              backgroundColor: '#334155',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                fontSize: '40px',
                fontWeight: '700',
                color: '#3b82f6',
              }}
            >
              95%
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Cost Savings
            </div>
          </div>

          <div
            style={{
              width: '2px',
              height: '60px',
              backgroundColor: '#334155',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                fontSize: '40px',
                fontWeight: '700',
                color: '#f59e0b',
              }}
            >
              24/7
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Live System
            </div>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: '60px',
            fontSize: '20px',
            color: '#64748b',
          }}
        >
          consulatehq.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}