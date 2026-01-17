import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Chorus
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium hover:text-muted-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-16">
          <div className="max-w-3xl mx-auto text-center opacity-0 animate-fade-in-up">
            <p className="text-sm font-medium text-muted-foreground mb-6 tracking-wide uppercase">
              AI-Powered Research Platform
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.1] text-balance">
              Customer research at the speed of thought
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Run AI-driven interviews that adapt in real-time. Get research-grade insights in hours, not weeks.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-all hover:scale-[1.02]"
              >
                Start for free
              </Link>
              <Link
                href="#features"
                className="px-8 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in animate-delay-300">
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6 bg-neutral-50/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 opacity-0 animate-fade-in-up">
              <p className="text-sm font-medium text-muted-foreground mb-4 tracking-wide uppercase">
                Features
              </p>
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
                Research reimagined
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-2xl bg-white border border-black/5 hover:border-black/10 transition-all hover:shadow-lg opacity-0 animate-fade-in-up animate-delay-100">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Video Avatars</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Realistic avatars conduct interviews, matched to participant demographics for authentic conversations.
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-white border border-black/5 hover:border-black/10 transition-all hover:shadow-lg opacity-0 animate-fade-in-up animate-delay-200">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Adaptive Questions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Questions evolve in real-time based on responses. The system learns what works best over time.
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-white border border-black/5 hover:border-black/10 transition-all hover:shadow-lg opacity-0 animate-fade-in-up animate-delay-300">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Reports</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Comprehensive research reports generated automatically with key findings and recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
              Ready to transform your research?
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
              Join teams using Chorus to understand their customers at scale.
            </p>
            <Link
              href="/login"
              className="inline-flex px-8 py-3.5 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-all hover:scale-[1.02]"
            >
              Get started for free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Chorus
          </p>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
