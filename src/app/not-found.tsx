import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold text-ink mb-1">404</h1>
      <h2 className="text-base font-semibold text-ink-2 mb-2">Page Not Found</h2>
      <p className="text-xs text-ink-3 max-w-sm mb-6">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="btn btn-primary h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center"
      >
        Return to Portfolio
      </Link>
    </div>
  );
}

