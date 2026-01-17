import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Chorus</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            AI-Powered Customer Research
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Qualitative depth at quantitative scale. Run AI-driven, avatar-based customer interviews
            that adapt in real time and synthesize into research-grade reports.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t bg-muted/50 py-24">
          <div className="container">
            <h2 className="text-center text-3xl font-bold">Why Chorus?</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg bg-background p-6 shadow-sm">
                <div className="mb-4 text-4xl">🎭</div>
                <h3 className="mb-2 text-xl font-semibold">AI Video Avatars</h3>
                <p className="text-muted-foreground">
                  Realistic video avatars conduct interviews, matched to participant demographics for
                  maximum comfort and disclosure.
                </p>
              </div>
              <div className="rounded-lg bg-background p-6 shadow-sm">
                <div className="mb-4 text-4xl">🧠</div>
                <h3 className="mb-2 text-xl font-semibold">Adaptive Questions</h3>
                <p className="text-muted-foreground">
                  Questions adapt in real-time based on responses. The system learns which questions
                  work best over time.
                </p>
              </div>
              <div className="rounded-lg bg-background p-6 shadow-sm">
                <div className="mb-4 text-4xl">📊</div>
                <h3 className="mb-2 text-xl font-semibold">Instant Reports</h3>
                <p className="text-muted-foreground">
                  Get comprehensive research reports automatically generated with key findings,
                  quotes, and recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container text-center">
            <h2 className="text-3xl font-bold">Ready to transform your research?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join companies using Chorus to understand their customers at scale.
            </p>
            <Link href="/signup">
              <Button size="lg" className="mt-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Chorus. All rights reserved.</p>
          <nav className="flex space-x-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
