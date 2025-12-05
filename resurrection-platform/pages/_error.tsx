import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
}

function Error({ statusCode }: ErrorProps) {
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
          {statusCode === 404 ? '404 - Page Not Found' : `Error ${statusCode || 'Unknown'}`}
        </h2>
        <p style={{
          marginBottom: '1rem',
          color: '#a78bfa',
          fontSize: '1.125rem'
        }}>
          {statusCode === 404
            ? 'This page has vanished into the shadows'
            : 'A curse has befallen this page'}
        </p>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#8b5cf6',
              color: '#F7F7FF',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            🏠 Return Home
          </a>
        </div>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
