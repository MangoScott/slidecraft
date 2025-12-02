'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

import {
  MinimalistTemplate,
  HybridTemplate,
  MaximalistTemplate,
  MinimalistSlide,
  HybridSlide,
  MaximalistSlide,
  Presentation
} from '../components/PresentationTemplates';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Step = 'input' | 'customize' | 'generating' | 'result';
type InputType = 'url' | 'file';
type TemplateType = 'minimalist' | 'hybrid' | 'maximalist';

// Curated palettes
const PALETTES = [
  '#4A9B8C', // Teal
  '#FF6B6B', // Coral
  '#4ECDC4', // Mint
  '#1a1a1a', // Black
  '#45B7D1', // Sky
  '#96CEB4', // Sage
];

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
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [accentColor, setAccentColor] = useState('#4A9B8C');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('minimalist');

  // Result
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0: Analyzing, 1: Extracting, 2: Designing, 3: Finalizing
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const projectImagesInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    if (f.type === 'text/plain' || f.name.endsWith('.md') || f.name.endsWith('.txt')) {
      const text = await f.text();
      setFileContent(text);
    } else if (f.type === 'application/pdf') {
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

  const handleProjectImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map(f => URL.createObjectURL(f));
      setProjectImages(prev => [...prev, ...newImages].slice(0, 5));
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
    setLoadingStep(0);
    setError('');

    // Simulate loading steps for UX
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2000);

    try {
      let contentToUse = '';
      let titleToUse = '';
      let descriptionToUse = '';
      let urlToUse = '';

      // 1. Get Content
      if (inputType === 'url') {
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
        if (file?.type === 'application/pdf') {
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
          imageCount: projectImages.length,
        }),
      });

      if (!genRes.ok) throw new Error('Failed to generate presentation');
      const data = await genRes.json();

      clearInterval(stepInterval);

      if (data.presentation) {
        // Post-process slides to replace image placeholders
        const processedSlides = data.presentation.slides.map((slide: any) => {
          const replacePlaceholders = (str: string) => {
            if (typeof str !== 'string') return str;
            const match = str.match(/{{USER_IMAGE_(\d+)}}/);
            if (match) {
              const index = parseInt(match[1]) - 1;
              if (projectImages[index]) {
                return projectImages[index]; // Return the blob URL
              }
            }
            return str;
          };

          // Deep traverse to find and replace placeholders
          const processObject = (obj: any): any => {
            if (typeof obj === 'string') return replacePlaceholders(obj);
            if (Array.isArray(obj)) return obj.map(processObject);
            if (typeof obj === 'object' && obj !== null) {
              const newObj: any = {};
              for (const key in obj) {
                newObj[key] = processObject(obj[key]);
              }
              return newObj;
            }
            return obj;
          };

          return processObject(slide);
        });

        setPresentation({ ...data.presentation, slides: processedSlides });
        setStep('result');
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err: unknown) {
      clearInterval(stepInterval);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleSlideEdit = (slideIndex: number, field: string, value: any) => {
    if (!presentation) return;
    const newSlides = [...presentation.slides];
    newSlides[slideIndex] = { ...newSlides[slideIndex], [field]: value };
    setPresentation({ ...presentation, slides: newSlides });
  };

  const handleAddSlide = (index: number) => {
    if (!presentation) return;
    const newSlide: any = {
      type: 'content',
      title: 'New Slide',
      text: 'Click to edit this text...',
    };
    const newSlides = [...presentation.slides];
    newSlides.splice(index + 1, 0, newSlide);
    setPresentation({ ...presentation, slides: newSlides });
  };

  const handleDeleteSlide = (index: number) => {
    if (!presentation) return;
    const newSlides = presentation.slides.filter((_, i) => i !== index);
    setPresentation({ ...presentation, slides: newSlides });
  };

  const handleAddImageSlide = (index: number, file: File) => {
    if (!presentation) return;
    const imageUrl = URL.createObjectURL(file);
    const newSlide: any = {
      type: 'image',
      image: imageUrl,
      caption: 'Click to add caption...',
    };
    const newSlides = [...presentation.slides];
    newSlides.splice(index + 1, 0, newSlide);
    setPresentation({ ...presentation, slides: newSlides });
  };

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        // Target size: 960x540
        // Leave some padding for arrows (e.g. 100px on each side)
        const availableWidth = windowWidth - 160;
        const availableHeight = windowHeight - 40;

        const scaleX = availableWidth / 960;
        const scaleY = availableHeight / 540;
        const newScale = Math.min(scaleX, scaleY, 1.5); // Max scale 1.5 to avoid pixelation
        setScale(newScale);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // Fullscreen controls (Escape key & Cursor hiding)
  const [showCursor, setShowCursor] = useState(true);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isFullscreen) {
      setShowCursor(true);
      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    const handleMouseMove = () => {
      setShowCursor(true);
      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = setTimeout(() => {
        setShowCursor(false);
      }, 3000);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    // Initial timeout start
    cursorTimeoutRef.current = setTimeout(() => {
      setShowCursor(false);
    }, 3000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownloadPDF = async () => {
    if (!presentation) return;

    const printContainer = document.getElementById('print-container');
    if (!printContainer) return;

    // Make visible for capture (but off-screen via CSS)
    printContainer.style.display = 'block';

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [960, 540]
    });

    const slides = printContainer.children;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i] as HTMLElement;

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(slide, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) pdf.addPage([960, 540], 'landscape');
      pdf.addImage(imgData, 'PNG', 0, 0, 960, 540);
    }

    pdf.save(`${presentation.title.replace(/\s+/g, '_')}.pdf`);

    // Hide again
    printContainer.style.display = 'none';
  };

  const handleExportToSlides = async () => {
    if (!presentation) return;

    // For now, show instructions for manual export
    // In production, this would integrate with Google Slides API
    const message = `📊 Google Slides Export\n\nTo export your presentation to Google Slides:\n\n1. Click the "PDF" button to download your presentation\n2. Go to Google Slides (slides.google.com)\n3. Create a new presentation\n4. Use File → Import slides\n5. Upload your downloaded PDF\n\nFull Google Slides API integration coming soon!`;

    alert(message);

    // Optionally trigger PDF download automatically
    // handleDownloadPDF();
  };

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 0: return 'Analyzing content structure...';
      case 1: return 'Extracting key insights...';
      case 2: return 'Applying design system...';
      case 3: return 'Finalizing slides...';
      default: return 'Processing...';
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
            <div className={styles.heroContent}>
              {step === 'input' && (
                <h1 className={styles.heroTitle}>
                  Turn content into <br />
                  <span>beautiful slides</span>.
                </h1>
              )}

              <div className={styles.wizardContainer}>
                {/* Progress Steps */}
                <div className={styles.wizardSteps}>
                  <div className={`${styles.wizardStep} ${step === 'input' ? styles.active : ''} ${step !== 'input' ? styles.completed : ''}`}>1. Content</div>
                  <div className={`${styles.wizardStep} ${step === 'customize' ? styles.active : ''} ${step === 'generating' ? styles.completed : ''}`}>2. Style</div>
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
                        🔗 URL Link
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
                              <div className={`${styles.templatePreview} ${t.id === 'minimalist' ? styles.previewMin :
                                t.id === 'hybrid' ? styles.previewHyb : styles.previewMax
                                }`} />
                              <span className={styles.templateName}>{t.name}</span>
                              <span className={styles.templateDesc}>{t.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.customGroup}>
                        <label>Branding & Images</label>
                        <div className={styles.brandingRow}>
                          <div
                            className={styles.logoUpload}
                            onClick={() => logoInputRef.current?.click()}
                            style={{ backgroundImage: logo ? `url(${logo})` : 'none' }}
                          >
                            {!logo && (
                              <>
                                <span style={{ fontSize: 24, marginBottom: 8 }}>+</span>
                                <span>Upload Logo</span>
                              </>
                            )}
                            <input
                              type="file"
                              ref={logoInputRef}
                              onChange={handleLogoUpload}
                              accept="image/*"
                              hidden
                            />
                          </div>

                          {/* Project Images Upload */}
                          <div className={styles.projectImagesContainer}>
                            <div className={styles.projectImagesGrid}>
                              {projectImages.map((img, i) => (
                                <div key={i} className={styles.miniImagePreview} style={{ backgroundImage: `url(${img})` }}>
                                  <button
                                    className={styles.removeImageBtn}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProjectImages(prev => prev.filter((_, idx) => idx !== i));
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              {projectImages.length < 5 && (
                                <div
                                  className={styles.addImageBtn}
                                  onClick={() => projectImagesInputRef.current?.click()}
                                >
                                  <span>+ Add Image</span>
                                </div>
                              )}
                            </div>
                            <input
                              type="file"
                              ref={projectImagesInputRef}
                              onChange={handleProjectImagesUpload}
                              accept="image/*"
                              multiple
                              hidden
                            />
                            <p className={styles.inputHelp}>Upload up to 5 images for the AI to use.</p>
                          </div>

                          <div className={styles.colorPickerContainer}>
                            <div className={styles.paletteGrid}>
                              {PALETTES.map(color => (
                                <button
                                  key={color}
                                  className={`${styles.paletteBtn} ${accentColor === color ? styles.activePalette : ''}`}
                                  style={{ background: color }}
                                  onClick={() => setAccentColor(color)}
                                />
                              ))}
                            </div>
                            <div className={styles.customColorInput}>
                              <span>Custom:</span>
                              <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                              />
                            </div>
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
                    <div className={styles.loaderContainer}>
                      <div className={styles.spinner}></div>
                    </div>
                    <div className={styles.loadingStep}>{getLoadingMessage()}</div>
                    <div className={styles.loadingSub}>This may take up to 30 seconds</div>
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

                <div className={styles.headerRight}>
                  <div className={styles.exportButtons}>
                    <button onClick={toggleFullscreen} className={styles.expandBtn} title="Present in fullscreen">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                      <span>Expand</span>
                    </button>
                    <button onClick={handleDownloadPDF} className={styles.exportBtn} title="Download as PDF">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>PDF</span>
                    </button>
                    <button onClick={handleExportToSlides} className={styles.exportBtn} title="Export to Google Slides">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="9" x2="15" y2="9" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      <span>Slides</span>
                    </button>
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
              </div>

              {isFullscreen && (
                <div
                  className={styles.fullscreenWrapper}
                  style={{ cursor: showCursor ? 'default' : 'none' }}
                >
                  <button className={styles.fullscreenClose} onClick={toggleFullscreen}>×</button>
                  <div
                    className={styles.viewerWrapper}
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'center center'
                    }}
                  >
                    {selectedTemplate === 'minimalist' && (
                      <MinimalistTemplate slides={presentation.slides} logoUrl={logo || undefined} isFullscreen={true} />
                    )}
                    {selectedTemplate === 'hybrid' && (
                      <HybridTemplate slides={presentation.slides} accentColor={accentColor} logoUrl={logo || undefined} isFullscreen={true} />
                    )}
                    {selectedTemplate === 'maximalist' && (
                      <MaximalistTemplate slides={presentation.slides} logoUrl={logo || undefined} isFullscreen={true} />
                    )}
                  </div>
                </div>
              )}

              <div className={styles.viewerWrapper}>
                {selectedTemplate === 'minimalist' && (
                  // @ts-ignore
                  <MinimalistTemplate
                    slides={presentation.slides}
                    logoUrl={logo || undefined}
                    onEdit={handleSlideEdit}
                    onAdd={handleAddSlide}
                    onAddImage={handleAddImageSlide}
                    onDelete={handleDeleteSlide}
                  />
                )}
                {selectedTemplate === 'hybrid' && (
                  <HybridTemplate
                    slides={presentation.slides}
                    accentColor={accentColor}
                    logoUrl={logo || undefined}
                    onEdit={handleSlideEdit}
                    onAdd={handleAddSlide}
                    onAddImage={handleAddImageSlide}
                    onDelete={handleDeleteSlide}
                  />
                )}
                {selectedTemplate === 'maximalist' && (
                  <MaximalistTemplate
                    slides={presentation.slides}
                    logoUrl={logo || undefined}
                    onEdit={handleSlideEdit}
                    onAdd={handleAddSlide}
                    onAddImage={handleAddImageSlide}
                    onDelete={handleDeleteSlide}
                  />
                )}
              </div>

              {/* Hidden Print Container */}
              <div id="print-container" className={styles.printContainer} style={{ display: 'none' }}>
                {presentation.slides.map((slide, i) => (
                  <div key={i} className={styles.printSlide} style={{ width: 960, height: 540, position: 'relative', overflow: 'hidden', background: 'white' }}>
                    {selectedTemplate === 'minimalist' && (
                      <div style={{ width: 960, height: 540, position: 'relative', padding: 60, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MinimalistSlide slide={slide} logoUrl={logo || undefined} />
                      </div>
                    )}
                    {selectedTemplate === 'hybrid' && (
                      <div style={{ width: 960, height: 540, position: 'relative', padding: '60px 60px 60px 80px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accentColor }} />
                        <HybridSlide slide={slide} accentColor={accentColor} logoUrl={logo || undefined} />
                      </div>
                    )}
                    {selectedTemplate === 'maximalist' && (
                      <MaximalistSlide slide={slide} logoUrl={logo || undefined} />
                    )}
                  </div>
                ))}
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
