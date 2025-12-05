'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
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
          A curse has befallen this page
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
          >
            🔮 Try Again
          </button>
          <a
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#a78bfa',
              border: '2px solid #5b21b6',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            🏠 Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
