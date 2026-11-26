import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MuscleCraft — Build Discipline. Sculpt Strength. Premier Gym & 1-on-1 Coaching Sri Lanka';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #08080a 0%, #15090b 55%, #0a0a0e 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '9999px',
              background: '#dc2626',
            }}
          />
          <span
            style={{
              fontSize: '18px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: '#f87171',
              fontWeight: 700,
            }}
          >
            SRI LANKA PREMIER STRENGTH &amp; COACHING
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              fontSize: '84px',
              fontWeight: 900,
              letterSpacing: '-2px',
              lineHeight: 1.0,
              display: 'flex',
            }}
          >
            <span>MUSCLE</span>
            <span style={{ color: '#dc2626' }}>CRAFT</span>
          </div>
          <div
            style={{
              fontSize: '34px',
              fontWeight: 600,
              color: '#e5e7eb',
              letterSpacing: '-0.5px',
            }}
          >
            Build Discipline. Sculpt Strength.
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#9ca3af',
              maxWidth: '860px',
              lineHeight: 1.4,
            }}
          >
            Sole &amp; Couple Gym Memberships · BurnZone Conditioning · 90 Days Better Me 1-on-1 Coaching with Coach Adeesha Kumarasingha
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: '24px',
            fontSize: '20px',
            color: '#d1d5db',
          }}
        >
          <span>musclecraft.lk</span>
          <span style={{ color: '#f87171', fontWeight: 700 }}>From Rs. 4,500 / Month</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
