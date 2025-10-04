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
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
          padding: '80px',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
        }}
      >
        {/* Accent bar - top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '80px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
            }}
          >
            ⚖️
          </div>
          <div
            style={{
              fontSize: '56px',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            Consulate
          </div>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: '84px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.2,
            margin: '0 0 40px 0',
            textAlign: 'center',
            maxWidth: '1040px',
            letterSpacing: '-0.02em',
            padding: '0 20px',
          }}
        >
          Resolve AI Agent Disputes
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '36px',
            color: '#475569',
            lineHeight: 1.4,
            margin: '0',
            textAlign: 'center',
            maxWidth: '800px',
            fontWeight: '500',
          }}
        >
          Automated arbitration for enterprise AI vendors
        </p>

        {/* Accent bar - bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}