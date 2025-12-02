'use client';

import { useEffect, useRef } from 'react';
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css'; // Default theme

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

interface PresentationViewerProps {
    presentation: Presentation;
}

export default function PresentationViewer({ presentation }: PresentationViewerProps) {
    const deckRef = useRef<HTMLDivElement>(null);
    const revealRef = useRef<Reveal.Api | null>(null);

    useEffect(() => {
        if (deckRef.current && !revealRef.current) {
            // Initialize Reveal.js
            // We need to import it dynamically or ensure it runs only on client
            const initReveal = async () => {
                const Reveal = (await import('reveal.js')).default;
                revealRef.current = new Reveal(deckRef.current!, {
                    embedded: true, // Important for using inside a component
                    hash: false,
                    controls: true,
                    progress: true,
                    center: true,
                    transition: 'slide',
                });
                revealRef.current.initialize();
            };

            initReveal();
        }

        // Cleanup
        return () => {
            if (revealRef.current) {
                try {
                    revealRef.current.destroy();
                    revealRef.current = null;
                } catch (e) {
                    console.error('Error destroying reveal instance', e);
                }
            }
        };
    }, []);

    // Update slides when presentation changes
    useEffect(() => {
        if (revealRef.current) {
            revealRef.current.sync();
            revealRef.current.slide(0);
        }
    }, [presentation]);

    return (
        <div className="reveal-container" style={{ height: '500px', width: '100%', position: 'relative', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="reveal" ref={deckRef}>
                <div className="slides">
                    {presentation.slides.map((slide, index) => (
                        <section key={index} data-notes={slide.notes}>
                            {slide.type === 'title' ? (
                                <>
                                    <h2>{slide.title}</h2>
                                    {slide.subtitle && <h4>{slide.subtitle}</h4>}
                                </>
                            ) : (
                                <>
                                    <h3>{slide.title}</h3>
                                    {slide.content && (
                                        <ul>
                                            {slide.content.map((item, i) => (
                                                <li key={i} className="fragment">{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
