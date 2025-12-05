import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      color: '#F7F7FF'
    }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        404 - Page Not Found
      </h2>
      <p style={{ marginBottom: '1rem', color: '#a78bfa' }}>
        Could not find requested resource
      </p>
      <Link
        href="/"
        style={{
          padding: '0.5rem 1rem',
          background: '#8b5cf6',
          color: '#F7F7FF',
          borderRadius: '0.375rem',
          textDecoration: 'none'
        }}
      >
        Return Home
      </Link>
    </div>
  )
}
