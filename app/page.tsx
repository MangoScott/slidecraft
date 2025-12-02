'use client';

import { useState } from 'react';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import PhysicsHero from '../components/PhysicsHero';

// Dynamically import PresentationViewer to avoid SSR issues with reveal.js
const PresentationViewer = dynamic(() => import('../components/PresentationViewer'), {
  ssr: false,
  loading: () => <div className={styles.loadingSlide}>Loading Presentation...</div>
});

interface ScrapedData {
  title: string;
  description: string;
  image: string;
  content: string;
  url: string;
}

interface Slide {
  type: 'title' | 'content';
  title: string;
  subtitle?: string;
  content?: string[];
  notes?: string;
}

interface Presentation {
  title: string;
  slides: Slide[];
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setPresentation(null);

    try {
      // Step 1: Scrape the URL
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!scrapeRes.ok) {
        const errorData = await scrapeRes.json();
        throw new Error(errorData.error || 'Failed to scrape URL');
      }

      const scraped: ScrapedData = await scrapeRes.json();

      // Step 2: Generate presentation
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scraped,
          notes,
        }),
      });

      if (!genRes.ok) {
        const errorData = await genRes.json();
        throw new Error(errorData.error || 'Failed to generate presentation');
      }

      const data = await genRes.json();
      if (data.presentation) {
        setPresentation(data.presentation);
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <a href="/" className={styles.logo}>SlideCraft<span>.</span></a>
          <div className={styles.navLinks}>
            <a href="#how-it-works">How It Works</a>
            <a href="#" className={styles.navBtn}>Get Started</a>
          </div>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={mobileMenuOpen ? styles.open : ''}></span>
            <span className={mobileMenuOpen ? styles.open : ''}></span>
            <span className={mobileMenuOpen ? styles.open : ''}></span>
          </button>
        </nav>
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#" className={styles.navBtn} onClick={() => setMobileMenuOpen(false)}>Get Started</a>
          </div>
        )}
      </header>

      <main>
        <section className={styles.hero}>
          <PhysicsHero />

          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Turn any URL into a <br />
              <span>beautiful presentation</span>.
            </h1>
            <p className={styles.heroSubtitle}>
              SlideCraft uses AI to transform articles, blogs, and docs into professional slide decks.
              Just drop a link and watch the magic happen.
            </p>

            <form onSubmit={handleSubmit} className={styles.heroForm}>
              <div className={styles.inputWrapper}>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a URL (e.g., https://example.com/article)"
                  required
                  className={styles.heroInput}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.heroButton}
                >
                  {loading ? 'Creating...' : 'Create Presentation'}
                </button>
              </div>

              <div className={styles.notesWrapper}>
                <button
                  type="button"
                  className={styles.notesToggle}
                  onClick={() => document.getElementById('notes-area')?.classList.toggle(styles.visible)}
                >
                  + Add Notes (Optional)
                </button>
                <div id="notes-area" className={styles.notesArea}>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add context, specific focus, or key points to include..."
                    rows={2}
                    className={styles.notesInput}
                  />
                </div>
              </div>
            </form>

            {error && (
              <div className={styles.error}>
                <span>⚠️</span> {error}
              </div>
            )}
          </div>
        </section>

        <section id="how-it-works" className={styles.howItWorks}>
          <div className={styles.howItWorksContainer}>
            <h2>How It Works</h2>
            <p className={styles.sectionSubtitle}>
              Three simple steps to turn any article into a professional presentation
            </p>

            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepIcon}>🔗</div>
                <h3>Paste a URL</h3>
                <p>Drop in a link to any article, blog post, or documentation page.</p>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepIcon}>✨</div>
                <h3>AI Analyzes</h3>
                <p>Our AI reads the content and structures it into logical slides.</p>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepIcon}>🎨</div>
                <h3>Present & Export</h3>
                <p>Navigate your slides, present fullscreen, or export to PDF.</p>
              </div>
            </div>
          </div>
        </section>

        {presentation && (
          <section id="results" className={styles.resultsSection}>
            <div className={styles.resultsContainer}>
              <div className={styles.presentationHeader}>
                <h2>{presentation.title}</h2>
                <div className={styles.actions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => window.print()}
                  >
                    🖨️ Print / PDF
                  </button>
                </div>
              </div>

              <div className={styles.viewerContainer}>
                <PresentationViewer presentation={presentation} />
              </div>

              <div className={styles.instructions}>
                <p>Use <strong>Arrow Keys</strong> or <strong>Spacebar</strong> to navigate. Press <strong>F</strong> for Fullscreen.</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
