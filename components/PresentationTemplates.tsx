import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================
// TYPES
// ============================================

export interface Slide {
    type: 'title' | 'statement' | 'two-column' | 'quote' | 'end' | 'big-number' | 'grid' | 'split';
    title?: string;
    subtitle?: string;
    text?: string;
    author?: string;
    keywords?: string[];
    // Two-column / Split
    left?: string[] | { title: string; value: string; label: string };
    right?: string[] | { title: string; value: string; label: string };
    // Big Number
    number?: string;
    label?: string;
    detail?: string;
    // Grid
    items?: { icon: string; label: string }[];
    // End
    cta?: string;
}

export interface Presentation {
    title: string;
    slides: Slide[];
}

interface TemplateProps {
    slides: Slide[];
    accentColor?: string;
    logoUrl?: string;
}

interface Shape {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    isCircle: boolean;
    rotation: number;
    floatPhase: number;
    floatSpeed: number;
    dragging: boolean;
}

// ============================================
// MINIMALIST TEMPLATE - "Stark"
// Pure black & white, Swiss design influence
// ============================================

export const MinimalistSlide: React.FC<{ slide: Slide; logoUrl?: string }> = ({ slide, logoUrl }) => {
    switch (slide.type) {
        case 'title':
            return (
                <div style={styles.min.titleSlide}>
                    {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 40, marginBottom: 40 }} />}
                    <h1 style={styles.min.titleMain}>{slide.title}</h1>
                    <p style={styles.min.titleSub}>{slide.subtitle}</p>
                </div>
            );
        case 'statement':
            return (
                <div style={styles.min.statementSlide}>
                    <p style={styles.min.statementText}>{slide.text}</p>
                </div>
            );
        case 'two-column':
            return (
                <div style={styles.min.twoColSlide}>
                    <h2 style={styles.min.twoColTitle}>{slide.title}</h2>
                    <div style={styles.min.twoColContainer}>
                        <div style={styles.min.column}>
                            {Array.isArray(slide.left) && slide.left.map((item, i) => (
                                <p key={i} style={styles.min.columnItem}>{item}</p>
                            ))}
                        </div>
                        <div style={styles.min.columnDivider} />
                        <div style={styles.min.column}>
                            {Array.isArray(slide.right) && slide.right.map((item, i) => (
                                <p key={i} style={styles.min.columnItem}>{item}</p>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case 'quote':
            return (
                <div style={styles.min.quoteSlide}>
                    <p style={styles.min.quoteText}>&quot;{slide.text}&quot;</p>
                    <p style={styles.min.quoteAuthor}>— {slide.author}</p>
                </div>
            );
        case 'end':
            return (
                <div style={styles.min.endSlide}>
                    <p style={styles.min.endText}>{slide.text || slide.title}</p>
                </div>
            );
        default:
            return (
                <div style={styles.min.statementSlide}>
                    <h2 style={styles.min.twoColTitle}>{slide.title}</h2>
                    <p style={styles.min.statementText}>{slide.text || slide.detail}</p>
                </div>
            );
    }
};

export const MinimalistTemplate: React.FC<TemplateProps> = ({ slides, logoUrl }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length, nextSlide, prevSlide]);

    const renderSlide = (slide: Slide) => {
        return <MinimalistSlide slide={slide} logoUrl={logoUrl} />;
    };

    return (
        <div style={styles.min.container}>
            <div style={styles.min.slideContainer}>
                {renderSlide(slides[currentSlide])}
            </div>
            <div style={styles.min.nav}>
                <button onClick={prevSlide} style={styles.min.navBtn}>←</button>
                <span style={styles.min.slideNum}>{currentSlide + 1} / {slides.length}</span>
                <button onClick={nextSlide} style={styles.min.navBtn}>→</button>
            </div>
            <div style={styles.min.label}>MINIMALIST — &quot;Stark&quot;</div>
        </div>
    );
};

// ============================================
// HYBRID TEMPLATE - "Kinetic"
// Minimalist + accent line + static keyword balls on title
// ============================================

export const HybridSlide: React.FC<{ slide: Slide; accentColor: string; logoUrl?: string }> = ({ slide, accentColor, logoUrl }) => {
    // Static ball positions for title slide
    const ballPositions = [
        { x: 480, y: 100 },
        { x: 580, y: 180 },
        { x: 650, y: 280 },
        { x: 520, y: 320 },
        { x: 420, y: 220 },
    ];

    switch (slide.type) {
        case 'title':
            return (
                <div style={styles.hyb.titleSlide}>
                    <div style={styles.hyb.titleContent}>
                        {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 32, marginBottom: 24 }} />}
                        <h1 style={styles.hyb.titleMain}>{slide.title}</h1>
                        <p style={styles.hyb.titleSub}>{slide.subtitle}</p>
                    </div>
                    {slide.keywords && slide.keywords.map((word, i) => {
                        const pos = ballPositions[i % ballPositions.length];
                        const size = 80 + word.length * 2;
                        return (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: pos.x,
                                    top: pos.y,
                                    width: size,
                                    height: size,
                                    borderRadius: '50%',
                                    border: `1.5px solid ${accentColor}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#fff',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: accentColor,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {word}
                            </div>
                        );
                    })}
                </div>
            );
        case 'statement':
            return (
                <div style={styles.hyb.statementSlide}>
                    <p style={styles.hyb.statementText}>{slide.text}</p>
                </div>
            );
        case 'two-column':
            return (
                <div style={styles.hyb.twoColSlide}>
                    <h2 style={styles.hyb.twoColTitle}>{slide.title}</h2>
                    <div style={styles.hyb.twoColContainer}>
                        <div style={styles.hyb.column}>
                            {Array.isArray(slide.left) && slide.left.map((item, i) => (
                                <p key={i} style={styles.hyb.columnItem}>{item}</p>
                            ))}
                        </div>
                        <div style={{ ...styles.hyb.columnDivider, background: accentColor, opacity: 0.3 }} />
                        <div style={styles.hyb.column}>
                            {Array.isArray(slide.right) && slide.right.map((item, i) => (
                                <p key={i} style={styles.hyb.columnItem}>{item}</p>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case 'quote':
            return (
                <div style={styles.hyb.quoteSlide}>
                    <p style={styles.hyb.quoteText}>&quot;{slide.text}&quot;</p>
                    <p style={{ ...styles.hyb.quoteAuthor, color: accentColor }}>— {slide.author}</p>
                </div>
            );
        case 'end':
            return (
                <div style={styles.hyb.endSlide}>
                    <p style={styles.hyb.endText}>{slide.text || slide.title}</p>
                </div>
            );
        default:
            return (
                <div style={styles.hyb.statementSlide}>
                    <h2 style={styles.hyb.twoColTitle}>{slide.title}</h2>
                    <p style={styles.hyb.statementText}>{slide.text || slide.detail}</p>
                </div>
            );
    }
};

export const HybridTemplate: React.FC<TemplateProps> = ({ slides, accentColor = '#4A9B8C', logoUrl }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Static ball positions for title slide
    const ballPositions = [
        { x: 480, y: 100 },
        { x: 580, y: 180 },
        { x: 650, y: 280 },
        { x: 520, y: 320 },
        { x: 420, y: 220 },
    ];

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length, nextSlide, prevSlide]);

    const slide = slides[currentSlide];

    const renderSlide = () => {
        return <HybridSlide slide={slide} accentColor={accentColor} logoUrl={logoUrl} />;
    };

    return (
        <div style={styles.hyb.container}>
            {/* Accent line on far left */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                background: accentColor,
            }} />

            <div style={styles.hyb.slideContainer}>
                {renderSlide()}
            </div>
            <div style={styles.hyb.nav}>
                <button onClick={prevSlide} style={{ ...styles.hyb.navBtn, borderColor: accentColor, color: accentColor }}>←</button>
                <span style={styles.hyb.slideNum}>{currentSlide + 1} / {slides.length}</span>
                <button onClick={nextSlide} style={{ ...styles.hyb.navBtn, borderColor: accentColor, color: accentColor }}>→</button>
            </div>
            <div style={styles.hyb.label}>HYBRID — &quot;Kinetic&quot;</div>
        </div>
    );
};

// ============================================
// MAXIMALIST TEMPLATE - "Carnaval"
// Brazilian-inspired with full physics/antigravity
// ============================================

const colors = {
    yellow: '#FFD23F',
    green: '#00C853',
    blue: '#00B4D8',
    pink: '#FF006E',
    orange: '#FF9500',
    purple: '#9B5DE5',
    coral: '#FF6B6B',
    lime: '#C7F464',
    teal: '#06D6A0',
    magenta: '#E500A4',
};

export const MaximalistSlide: React.FC<{ slide: Slide; logoUrl?: string; isStatic?: boolean }> = ({ slide, logoUrl, isStatic = false }) => {
    const [shapes, setShapes] = useState<Shape[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dragRef = useRef<any>(null);

    // Colors moved outside or memoized
    const colorArray = useMemo(() => Object.values(colors), []);

    // Initialize shapes for current slide
    useEffect(() => {
        const shapeConfigs = [
            // Varied shapes per slide type
            { count: 8, sizeRange: [40, 120] },
        ];

        const config = shapeConfigs[0];
        const newShapes = [];

        for (let i = 0; i < config.count; i++) {
            const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
            const isCircle = Math.random() > 0.3;

            newShapes.push({
                id: i,
                x: 50 + Math.random() * 650,
                y: 50 + Math.random() * 300,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size,
                color: colorArray[i % colorArray.length],
                isCircle,
                rotation: Math.random() * 30 - 15,
                floatPhase: Math.random() * Math.PI * 2,
                floatSpeed: 0.015 + Math.random() * 0.015,
                dragging: false,
            });
        }

        setShapes(newShapes);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slide]); // Re-init on slide change

    // Physics animation loop (antigravity mode always on)
    useEffect(() => {
        if (isStatic) return;

        const width = 800;
        const height = 440;
        const bounce = 0.7;

        const animate = () => {
            setShapes(prevShapes => {
                return prevShapes.map(shape => {
                    if (shape.dragging) return shape;

                    const { size, floatSpeed } = shape;
                    let { x, y, vx, vy, floatPhase } = shape;

                    // Antigravity float
                    floatPhase += floatSpeed;
                    const floatForceX = Math.sin(floatPhase) * 0.03;
                    const floatForceY = Math.cos(floatPhase * 0.7) * 0.03;

                    vy -= 0.01; // Slight upward drift
                    vx += floatForceX;
                    vy += floatForceY;
                    vx *= 0.995;
                    vy *= 0.995;

                    x += vx;
                    y += vy;

                    // Boundary collisions
                    if (x < 0) { x = 0; vx *= -bounce; }
                    if (x + size > width) { x = width - size; vx *= -bounce; }
                    if (y < 0) { y = 0; vy *= -bounce; }
                    if (y + size > height) { y = height - size; vy *= -bounce; }

                    return { ...shape, x, y, vx, vy, floatPhase };
                });
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [slide, isStatic]);

    // Drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent, shapeId: number) => {
        if (isStatic) return;
        e.preventDefault();
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) return;

        dragRef.current = {
            shapeId,
            offsetX: e.clientX - rect.left - shape.x,
            offsetY: e.clientY - rect.top - shape.y,
        };

        setShapes(prev => prev.map(s =>
            s.id === shapeId ? { ...s, dragging: true, vx: 0, vy: 0 } : s
        ));
    }, [shapes, isStatic]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isStatic) return;
        if (!dragRef.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragRef.current.offsetX;
        const newY = e.clientY - rect.top - dragRef.current.offsetY;

        setShapes(prev => prev.map(s => {
            if (s.id === dragRef.current.shapeId) {
                const vx = newX - s.x;
                const vy = newY - s.y;
                return { ...s, x: newX, y: newY, vx, vy };
            }
            return s;
        }));
    }, [isStatic]);

    const handleMouseUp = useCallback(() => {
        if (isStatic) return;
        if (!dragRef.current) return;

        setShapes(prev => prev.map(s =>
            s.id === dragRef.current.shapeId ? { ...s, dragging: false } : s
        ));

        dragRef.current = null;
    }, [isStatic]);

    useEffect(() => {
        if (isStatic) return;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp, isStatic]);

    const renderContent = () => {
        switch (slide.type) {
            case 'title':
                return (
                    <div style={styles.max.titleContent}>
                        {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 50, marginBottom: 20 }} />}
                        <h1 style={styles.max.titleMain}>{slide.title}</h1>
                        <p style={styles.max.titleSub}>{slide.subtitle}</p>
                    </div>
                );
            case 'big-number':
                return (
                    <div style={styles.max.bigNumContent}>
                        <span style={{ ...styles.max.bigNum, background: `linear-gradient(135deg, ${colors.pink}, ${colors.orange}, ${colors.yellow})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{slide.number}</span>
                        <h2 style={styles.max.bigNumLabel}>{slide.label}</h2>
                        <p style={styles.max.bigNumDetail}>{slide.detail}</p>
                    </div>
                );
            case 'grid':
                return (
                    <div style={styles.max.gridContent}>
                        <h2 style={styles.max.gridTitle}>{slide.title}</h2>
                        <div style={styles.max.gridContainer}>
                            {slide.items && slide.items.map((item, i) => {
                                const itemColors = [colors.pink, colors.blue, colors.yellow, colors.green, colors.purple, colors.orange];
                                const textColors = ['#fff', '#fff', '#000', '#fff', '#fff', '#fff'];
                                return (
                                    <div key={i} style={{ ...styles.max.gridItem, background: itemColors[i % itemColors.length], color: textColors[i % textColors.length] }}>
                                        <span style={styles.max.gridIcon}>{item.icon}</span>
                                        <span style={styles.max.gridLabel}>{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'split':
                const left = slide.left as { title: string; value: string; label: string };
                const right = slide.right as { title: string; value: string; label: string };
                return (
                    <div style={styles.max.splitContent}>
                        <div style={{ ...styles.max.splitHalf, background: colors.coral }}>
                            <span style={styles.max.splitTitle}>{left?.title}</span>
                            <span style={styles.max.splitValue}>{left?.value}</span>
                            <span style={styles.max.splitLabel}>{left?.label}</span>
                        </div>
                        <div style={styles.max.splitDivider}>
                            <div style={{ ...styles.max.splitArrowCircle, background: colors.yellow }}>→</div>
                        </div>
                        <div style={{ ...styles.max.splitHalf, background: colors.green }}>
                            <span style={styles.max.splitTitle}>{right?.title}</span>
                            <span style={styles.max.splitValue}>{right?.value}</span>
                            <span style={styles.max.splitLabel}>{right?.label}</span>
                        </div>
                    </div>
                );
            case 'end':
                return (
                    <div style={styles.max.endContent}>
                        <h1 style={styles.max.endTitle}>{slide.title || slide.text}</h1>
                        {slide.cta && <button style={{ ...styles.max.ctaBtn, background: colors.pink }}>{slide.cta}</button>}
                    </div>
                );
            default:
                // Fallback
                return (
                    <div style={styles.max.titleContent}>
                        <h1 style={styles.max.titleMain}>{slide.title}</h1>
                        <p style={styles.max.titleSub}>{slide.text || slide.subtitle}</p>
                    </div>
                );
        }
    };

    return (
        <div
            ref={containerRef}
            style={styles.max.slideContainer}
        >
            {/* Physics shapes layer */}
            {shapes.map((shape) => (
                <div
                    key={shape.id}
                    onMouseDown={(e) => handleMouseDown(e, shape.id)}
                    style={{
                        position: 'absolute',
                        left: shape.x,
                        top: shape.y,
                        width: shape.size,
                        height: shape.size,
                        borderRadius: shape.isCircle ? '50%' : shape.size * 0.2,
                        background: shape.color,
                        transform: `rotate(${shape.rotation}deg)`,
                        cursor: shape.dragging ? 'grabbing' : 'grab',
                        transition: shape.dragging ? 'none' : 'box-shadow 0.2s',
                        boxShadow: shape.dragging
                            ? `0 12px 40px ${shape.color}50`
                            : `0 6px 24px ${shape.color}30`,
                        zIndex: shape.dragging ? 100 : 1,
                        userSelect: 'none',
                    }}
                />
            ))}

            {/* Content layer */}
            <div style={styles.max.contentLayer}>
                {renderContent()}
            </div>
        </div>
    );
};

export const MaximalistTemplate: React.FC<TemplateProps> = ({ slides, logoUrl }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % slides.length), [slides.length]);
    const prevSlide = useCallback(() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length), [slides.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length, nextSlide, prevSlide]);

    return (
        <div style={styles.max.container}>
            <MaximalistSlide slide={slides[currentSlide]} logoUrl={logoUrl} />

            <div style={styles.max.nav}>
                <button onClick={prevSlide} style={{ ...styles.max.navBtn, background: colors.pink }}>←</button>
                <div style={styles.max.dots}>
                    {slides.map((_, i) => {
                        const dotColors = [colors.pink, colors.yellow, colors.green, colors.blue, colors.orange];
                        return (
                            <div
                                key={i}
                                style={{
                                    width: i === currentSlide ? 24 : 10,
                                    height: 10,
                                    borderRadius: 5,
                                    background: dotColors[i % dotColors.length],
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        );
                    })}
                </div>
                <button onClick={nextSlide} style={{ ...styles.max.navBtn, background: colors.green }}>→</button>
            </div>
            <div style={styles.max.label}>MAXIMALIST — &quot;Carnaval&quot;</div>
            <div style={styles.max.hint}>Drag the shapes!</div>
        </div>
    );
};

// ============================================
// STYLES
// ============================================

const baseFont = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles: Record<string, any> = {
    // Minimalist Styles
    min: {
        container: {
            width: 800,
            height: 500,
            background: '#fff',
            position: 'relative',
            fontFamily: baseFont,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            borderRadius: 16,
        },
        slideContainer: {
            width: '100%',
            height: 440,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            boxSizing: 'border-box',
        },
        titleSlide: {
            textAlign: 'center',
        },
        titleMain: {
            fontSize: 48,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.03em',
            color: '#1a1a1a',
            lineHeight: 1.1,
        },
        titleSub: {
            fontSize: 14,
            fontWeight: 500,
            marginTop: 20,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
        },
        statementSlide: {
            maxWidth: 600,
            textAlign: 'center',
        },
        statementText: {
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#1a1a1a',
            margin: 0,
        },
        twoColSlide: {
            width: '100%',
        },
        twoColTitle: {
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 40,
            textAlign: 'center',
            color: '#1a1a1a',
        },
        twoColContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 60,
        },
        column: {
            flex: 1,
            maxWidth: 250,
        },
        columnLabel: {
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#999',
            display: 'block',
            marginBottom: 16,
        },
        columnItem: {
            fontSize: 16,
            margin: '12px 0',
            color: '#1a1a1a',
            fontWeight: 500,
        },
        columnDivider: {
            width: 1,
            height: 200,
            background: '#e0e0e0',
        },
        quoteSlide: {
            textAlign: 'center',
            maxWidth: 550,
        },
        quoteText: {
            fontSize: 28,
            fontWeight: 500,
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: '#1a1a1a',
            margin: 0,
        },
        quoteAuthor: {
            fontSize: 13,
            fontWeight: 600,
            marginTop: 30,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
        },
        endSlide: {
            textAlign: 'center',
        },
        endText: {
            fontSize: 44,
            fontWeight: 700,
            color: '#1a1a1a',
            margin: 0,
        },
        nav: {
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
        },
        navBtn: {
            background: 'none',
            border: '1.5px solid #1a1a1a',
            width: 36,
            height: 36,
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            fontFamily: baseFont,
            transition: 'all 0.2s',
        },
        slideNum: {
            fontSize: 12,
            fontWeight: 500,
            color: '#666',
        },
        label: {
            position: 'absolute',
            top: 16,
            left: 20,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#999',
            textTransform: 'uppercase',
        },
    },

    // Hybrid Styles
    hyb: {
        container: {
            width: 800,
            height: 500,
            background: '#fff',
            position: 'relative',
            fontFamily: baseFont,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            borderRadius: 16,
        },
        slideContainer: {
            width: '100%',
            height: 440,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 60px 60px 80px',
            boxSizing: 'border-box',
            position: 'relative',
        },
        titleSlide: {
            width: '100%',
            height: '100%',
            position: 'relative',
        },
        titleContent: {
            position: 'absolute',
            top: 60,
            left: 0,
            zIndex: 10,
        },
        titleMain: {
            fontSize: 44,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.03em',
            color: '#1a1a1a',
            lineHeight: 1.1,
        },
        titleSub: {
            fontSize: 14,
            fontWeight: 500,
            marginTop: 16,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
        },
        statementSlide: {
            maxWidth: 600,
            textAlign: 'center',
        },
        statementText: {
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#1a1a1a',
            margin: 0,
        },
        twoColSlide: {
            width: '100%',
        },
        twoColTitle: {
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 40,
            textAlign: 'center',
            color: '#1a1a1a',
        },
        twoColContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 60,
        },
        column: {
            flex: 1,
            maxWidth: 250,
        },
        columnLabel: {
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            display: 'block',
            marginBottom: 16,
        },
        columnItem: {
            fontSize: 16,
            margin: '12px 0',
            color: '#1a1a1a',
            fontWeight: 500,
        },
        columnDivider: {
            width: 2,
            height: 200,
        },
        quoteSlide: {
            textAlign: 'center',
            maxWidth: 550,
        },
        quoteText: {
            fontSize: 28,
            fontWeight: 500,
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: '#1a1a1a',
            margin: 0,
        },
        quoteAuthor: {
            fontSize: 13,
            fontWeight: 600,
            marginTop: 30,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
        },
        endSlide: {
            textAlign: 'center',
        },
        endText: {
            fontSize: 44,
            fontWeight: 700,
            color: '#1a1a1a',
            margin: 0,
        },
        nav: {
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
        },
        navBtn: {
            background: 'none',
            border: '1.5px solid',
            width: 36,
            height: 36,
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            fontFamily: baseFont,
            transition: 'all 0.2s',
        },
        slideNum: {
            fontSize: 12,
            fontWeight: 500,
            color: '#666',
        },
        label: {
            position: 'absolute',
            top: 16,
            left: 20,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#999',
            textTransform: 'uppercase',
        },
    },

    // Maximalist Styles
    max: {
        container: {
            width: 800,
            height: 500,
            background: '#FFFBF5',
            position: 'relative',
            fontFamily: baseFont,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            borderRadius: 16,
        },
        slideContainer: {
            width: '100%',
            height: 440,
            position: 'relative',
        },
        contentLayer: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 10,
        },
        titleContent: {
            textAlign: 'center',
            pointerEvents: 'auto',
        },
        titleMain: {
            fontSize: 52,
            fontWeight: 800,
            color: '#1a1a1a',
            margin: 0,
            letterSpacing: '-0.03em',
        },
        titleSub: {
            fontSize: 18,
            color: '#555',
            marginTop: 16,
            fontWeight: 500,
        },
        bigNumContent: {
            textAlign: 'center',
            pointerEvents: 'auto',
        },
        bigNum: {
            fontSize: 110,
            fontWeight: 800,
            display: 'block',
            letterSpacing: '-0.04em',
        },
        bigNumLabel: {
            fontSize: 26,
            color: '#1a1a1a',
            margin: '10px 0 8px',
            fontWeight: 700,
        },
        bigNumDetail: {
            fontSize: 15,
            color: '#666',
            margin: 0,
            fontWeight: 500,
        },
        gridContent: {
            textAlign: 'center',
            pointerEvents: 'auto',
        },
        gridTitle: {
            fontSize: 32,
            color: '#1a1a1a',
            marginBottom: 30,
            fontWeight: 700,
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            maxWidth: 400,
        },
        gridItem: {
            borderRadius: 20,
            padding: '26px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
        },
        gridIcon: {
            fontSize: 26,
        },
        gridLabel: {
            fontSize: 15,
            fontWeight: 600,
        },
        splitContent: {
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'stretch',
            pointerEvents: 'auto',
        },
        splitHalf: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
        },
        splitTitle: {
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 12,
            opacity: 0.9,
        },
        splitValue: {
            fontSize: 68,
            fontWeight: 800,
        },
        splitLabel: {
            fontSize: 15,
            marginTop: 8,
            opacity: 0.9,
            fontWeight: 500,
        },
        splitDivider: {
            width: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFFBF5',
        },
        splitArrowCircle: {
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 700,
            color: '#1a1a1a',
        },
        endContent: {
            textAlign: 'center',
            pointerEvents: 'auto',
        },
        endTitle: {
            fontSize: 44,
            color: '#1a1a1a',
            fontWeight: 800,
            marginBottom: 28,
        },
        ctaBtn: {
            border: 'none',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            padding: '16px 40px',
            borderRadius: 50,
            cursor: 'pointer',
            fontFamily: baseFont,
        },
        nav: {
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 100,
        },
        navBtn: {
            border: 'none',
            color: '#fff',
            width: 40,
            height: 40,
            cursor: 'pointer',
            fontSize: 18,
            borderRadius: '50%',
            fontWeight: 600,
            fontFamily: baseFont,
        },
        dots: {
            display: 'flex',
            gap: 8,
            alignItems: 'center',
        },
        label: {
            position: 'absolute',
            top: 16,
            right: 20,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#999',
            textTransform: 'uppercase',
            zIndex: 100,
        },
        hint: {
            position: 'absolute',
            bottom: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 12,
            fontWeight: 500,
            color: '#999',
            zIndex: 100,
        },
    },
};
