import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="mb-4 text-muted-foreground">Could not find requested resource</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Return Home
      </Link>
    </div>
  )
}
