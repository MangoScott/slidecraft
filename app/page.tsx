'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import PhysicsHero from '../components/PhysicsHero';
import {
  MinimalistTemplate,
  HybridTemplate,
  MaximalistTemplate,
  Presentation,
  Slide
} from '../components/PresentationTemplates';

type Step = 'input' | 'customize' | 'generating' | 'result';
type InputType = 'url' | 'file';
type TemplateType = 'minimalist' | 'hybrid' | 'maximalist';

export default function Home() {
  // State
  const [step, setStep] = useState<Step>('input');
  const [inputType, setInputType] = useState<InputType>('url');

  // Input Data
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [notes, setNotes] = useState('');

  // Customization
  const [logo, setLogo] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('#4A9B8C');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('minimalist');

  // Result
  const [loading, setLoading] = useState(false);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [error, setError] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Smart URL: We don't force it here, but we can validate on blur or submit
    setUrl(val);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    // Parse immediately if text
    if (f.type === 'text/plain' || f.name.endsWith('.md') || f.name.endsWith('.txt')) {
      const text = await f.text();
      setFileContent(text);
    } else if (f.type === 'application/pdf') {
      // We'll parse PDF on submit or here? Let's do it here to show status
      setFileContent('PDF Selected');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const objectUrl = URL.createObjectURL(f);
      setLogo(objectUrl);
    }
  };

  const handleNext = async () => {
    if (step === 'input') {
      if (inputType === 'url' && !url) {
        setError('Please enter a URL');
        return;
      }
      if (inputType === 'file' && !file) {
        setError('Please upload a file');
        return;
      }
      setError('');
      setStep('customize');
    } else if (step === 'customize') {
      setStep('generating');
      await generatePresentation();
    }
  };

  const generatePresentation = async () => {
    setLoading(true);
    setError('');

    try {
      let contentToUse = '';
      let titleToUse = '';
      let descriptionToUse = '';
      let urlToUse = '';

      // 1. Get Content
      if (inputType === 'url') {
        // Smart URL fix
        let finalUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          finalUrl = 'https://' + url;
        }
        urlToUse = finalUrl;

        const scrapeRes = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: finalUrl }),
        });

        if (!scrapeRes.ok) throw new Error('Failed to scrape URL');
        const scraped = await scrapeRes.json();
        contentToUse = scraped.content;
        titleToUse = scraped.title;
        descriptionToUse = scraped.description;
      } else {
        // File
        if (file?.type === 'application/pdf') {
          // Parse PDF
          const formData = new FormData();
          formData.append('file', file);
          const parseRes = await fetch('/api/parse-pdf', {
            method: 'POST',
            body: formData,
          });
          if (!parseRes.ok) throw new Error('Failed to parse PDF');
          const data = await parseRes.json();
          contentToUse = data.text;
          titleToUse = file.name;
          descriptionToUse = 'Uploaded PDF content';
        } else {
          contentToUse = fileContent;
          titleToUse = file?.name || 'Uploaded File';
          descriptionToUse = 'Uploaded text content';
        }
      }

      // 2. Generate
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToUse,
          description: descriptionToUse,
          content: contentToUse,
          url: urlToUse,
          notes,
        }),
      });

      if (!genRes.ok) throw new Error('Failed to generate presentation');
      const data = await genRes.json();

      if (data.presentation) {
        setPresentation(data.presentation);
        setStep('result');
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setStep('input'); // Go back on error? Or stay?
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>SlideCraft<span>.</span></Link>
          <div className={styles.navLinks}>
            <a href="#how-it-works">How It Works</a>
            <a href="#" className={styles.navBtn}>Get Started</a>
          </div>
        </nav>
      </header>

      <main>
        {step !== 'result' && (
          <section className={styles.hero}>
            <PhysicsHero />

            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Turn content into <br />
                <span>beautiful slides</span>.
              </h1>

              <div className={styles.wizardContainer}>
                {/* Progress Steps */}
                <div className={styles.wizardSteps}>
                  <div className={`${styles.wizardStep} ${step === 'input' ? styles.active : ''} ${step !== 'input' ? styles.completed : ''}`}>1. Content</div>
                  <div className={styles.wizardLine} />
                  <div className={`${styles.wizardStep} ${step === 'customize' ? styles.active : ''} ${step === 'generating' ? styles.completed : ''}`}>2. Style</div>
                  <div className={styles.wizardLine} />
                  <div className={styles.wizardStep}>3. Result</div>
                </div>

                {/* STEP 1: INPUT */}
                {step === 'input' && (
                  <div className={styles.stepContent}>
                    <div className={styles.inputTabs}>
                      <button
                        className={`${styles.tabBtn} ${inputType === 'url' ? styles.activeTab : ''}`}
                        onClick={() => setInputType('url')}
                      >
                        🔗 URL
                      </button>
                      <button
                        className={`${styles.tabBtn} ${inputType === 'file' ? styles.activeTab : ''}`}
                        onClick={() => setInputType('file')}
                      >
                        📄 File Upload
                      </button>
                    </div>

                    {inputType === 'url' ? (
                      <input
                        type="url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="Paste a URL (e.g. finmango.org)"
                        className={styles.heroInput}
                        autoFocus
                      />
                    ) : (
                      <div
                        className={styles.fileDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".pdf,.txt,.md"
                          hidden
                        />
                        <span className={styles.fileIcon}>📂</span>
                        <p>{file ? file.name : 'Click to upload PDF or Text file'}</p>
                      </div>
                    )}

                    <div className={styles.notesWrapper}>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes, context, or specific focus areas..."
                        rows={2}
                        className={styles.notesInput}
                      />
                    </div>

                    <button onClick={handleNext} className={styles.heroButton}>
                      Next: Customize →
                    </button>
                  </div>
                )}

                {/* STEP 2: CUSTOMIZE */}
                {step === 'customize' && (
                  <div className={styles.stepContent}>
                    <div className={styles.customGrid}>
                      <div className={styles.customGroup}>
                        <label>Choose a Template</label>
                        <div className={styles.templateGrid}>
                          {[
                            { id: 'minimalist', name: 'Minimalist', desc: 'Stark & Clean' },
                            { id: 'hybrid', name: 'Hybrid', desc: 'Modern & Kinetic' },
                            { id: 'maximalist', name: 'Maximalist', desc: 'Bold & Fun' },
                          ].map(t => (
                            <button
                              key={t.id}
                              className={`${styles.templateCard} ${selectedTemplate === t.id ? styles.selectedTemplate : ''}`}
                              onClick={() => setSelectedTemplate(t.id as TemplateType)}
                            >
                              <span className={styles.templateName}>{t.name}</span>
                              <span className={styles.templateDesc}>{t.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.customGroup}>
                        <label>Branding</label>
                        <div className={styles.brandingRow}>
                          <div
                            className={styles.logoUpload}
                            onClick={() => logoInputRef.current?.click()}
                            style={{ backgroundImage: logo ? `url(${logo})` : 'none' }}
                          >
                            {!logo && <span>+ Logo</span>}
                            <input
                              type="file"
                              ref={logoInputRef}
                              onChange={handleLogoUpload}
                              accept="image/*"
                              hidden
                            />
                          </div>

                          <div className={styles.colorPicker}>
                            <span>Accent Color:</span>
                            <input
                              type="color"
                              value={accentColor}
                              onChange={(e) => setAccentColor(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.actionRow}>
                      <button onClick={() => setStep('input')} className={styles.backBtn}>
                        ← Back
                      </button>
                      <button onClick={handleNext} className={styles.heroButton}>
                        Generate Presentation ✨
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: GENERATING */}
                {step === 'generating' && (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <h3>Crafting your slides...</h3>
                    <p>Analyzing content, structuring narrative, and applying design.</p>
                  </div>
                )}

                {error && <div className={styles.error}>⚠️ {error}</div>}
              </div>
            </div>
          </section>
        )}

        {/* STEP 4: RESULT */}
        {step === 'result' && presentation && (
          <section className={styles.resultsSection}>
            <div className={styles.resultsContainer}>
              <div className={styles.presentationHeader}>
                <div className={styles.headerLeft}>
                  <button onClick={() => setStep('input')} className={styles.backLink}>← Create New</button>
                  <h2>{presentation.title}</h2>
                </div>

                <div className={styles.templateSwitcher}>
                  <label>Style:</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                  >
                    <option value="minimalist">Minimalist</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="maximalist">Maximalist</option>
                  </select>
                </div>
              </div>

              <div className={styles.viewerWrapper}>
                {selectedTemplate === 'minimalist' && (
                  <MinimalistTemplate slides={presentation.slides} logoUrl={logo || undefined} />
                )}
                {selectedTemplate === 'hybrid' && (
                  <HybridTemplate slides={presentation.slides} accentColor={accentColor} logoUrl={logo || undefined} />
                )}
                {selectedTemplate === 'maximalist' && (
                  <MaximalistTemplate slides={presentation.slides} logoUrl={logo || undefined} />
                )}
              </div>

              <div className={styles.instructions}>
                <p>Use <strong>Arrow Keys</strong> to navigate.</p>
              </div>
            </div>
          </section>
        )}

        {/* HOW IT WORKS SECTION */}
        {step !== 'result' && (
          <section id="how-it-works" className={styles.howItWorks}>
            <div className={styles.howItWorksContainer}>
              <h2 className={styles.sectionTitle}>How It Works</h2>
              <p className={styles.sectionSubtitle}>Transform any content into stunning presentations in three simple steps</p>

              <div className={styles.stepsGrid}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepIcon}>🔗</div>
                  <h3>Add Your Content</h3>
                  <p>Paste a URL or upload a PDF/text file. Our AI will extract and analyze the key information.</p>
                </div>

                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepIcon}>🎨</div>
                  <h3>Customize Your Style</h3>
                  <p>Choose from three stunning templates, upload your logo, and pick your brand colors.</p>
                </div>

                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepIcon}>✨</div>
                  <h3>Get Your Slides</h3>
                  <p>Watch as AI crafts a professional presentation with engaging layouts and compelling content.</p>
                </div>
              </div>

              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>⚡</span>
                  <span>Lightning Fast</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🤖</span>
                  <span>AI-Powered</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🎯</span>
                  <span>Professional Quality</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🎨</span>
                  <span>Fully Customizable</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>SlideCraft<span>.</span></h3>
            <p>AI-powered presentation generation</p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Product</h4>
              <a href="#how-it-works">How It Works</a>
              <a href="#">Features</a>
              <a href="#">Templates</a>
            </div>

            <div className={styles.footerColumn}>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>

            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; 2024 SlideCraft. All rights reserved.</p>
        </div>
      </footer>
    </div >
  );
}
