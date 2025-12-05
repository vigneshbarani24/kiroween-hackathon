'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          color: '#F7F7FF',
          padding: '1rem'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              🦇
            </div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#DC2626'
            }}>
              Something went wrong!
            </h2>
            <p style={{
              marginBottom: '1rem',
              color: '#a78bfa',
              fontSize: '1.125rem'
            }}>
              A curse has befallen the resurrection ritual
            </p>
            {error.message && (
              <div style={{
                background: '#1a0f2e',
                border: '2px solid #DC2626',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <p style={{
                  color: '#FF6B35',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  ⚠️ Error Details:
                </p>
                <p style={{
                  color: '#F7F7FF',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  wordBreak: 'break-word'
                }}>
                  {error.message}
                </p>
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#8b5cf6',
                  color: '#F7F7FF',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#7c3aed'}
                onMouseOut={(e) => e.currentTarget.style.background = '#8b5cf6'}
              >
                🔮 Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#a78bfa',
                  border: '2px solid #5b21b6',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#2e1065'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                🏠 Go Home
              </button>
            </div>
            <p style={{
              marginTop: '2rem',
              color: '#a78bfa',
              fontSize: '0.875rem',
              borderTop: '1px solid #5b21b6',
              paddingTop: '1rem'
            }}>
              If this curse persists, consult the grimoire or summon the maintainers
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
