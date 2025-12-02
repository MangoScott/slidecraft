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
    isFullscreen?: boolean;
    onAdd?: (index: number) => void;
    onDelete?: (index: number) => void;
}

const GlobalStyles = () => (
    <style>{`
        .editable-text:hover {
            border-bottom: 1px dashed rgba(0,0,0,0.3);
            background: rgba(0,0,0,0.02);
        }
        .slide-action-btn {
            opacity: 0;
            transition: opacity 0.2s;
        }
        .slide-container:hover .slide-action-btn {
            opacity: 1;
        }
    `}</style>
);

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

// Shared Arrow Styles
const getArrowStyles = (direction: 'left' | 'right', isFullscreen?: boolean) => {
    const base = {
        position: isFullscreen ? 'fixed' : 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        background: isFullscreen ? 'rgba(0, 0, 0, 0.5)' : 'white',
        border: isFullscreen ? '2px solid rgba(255, 255, 255, 0.3)' : '1px solid #ddd',
        width: isFullscreen ? 56 : 50,
        height: isFullscreen ? 56 : 50,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 24,
        boxShadow: isFullscreen ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
        zIndex: 1000,
        color: isFullscreen ? 'white' : '#1a1a1a',
        backdropFilter: isFullscreen ? 'blur(4px)' : 'none',
    };

    if (direction === 'left') {
        return { ...base, left: isFullscreen ? 32 : -80 };
    } else {
        return { ...base, right: isFullscreen ? 32 : -80 };
    }
};

// ============================================
// MINIMALIST TEMPLATE - "Stark"
// Pure black & white, Swiss design influence
// ============================================

// ============================================
// EDITABLE COMPONENT
// ============================================

interface EditableTextProps {
    value: string;
    onChange: (val: string) => void;
    style?: React.CSSProperties;
    tagName?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
    className?: string;
}

const EditableText: React.FC<EditableTextProps> = ({ value, onChange, style, tagName = 'p', className }) => {
    const Tag = tagName as any;

    return (
        <Tag
            contentEditable
            suppressContentEditableWarning
            onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.textContent || '')}
            style={{ ...style, outline: 'none', cursor: 'text' }}
            className={`editable-text ${className || ''}`}
        >
            {value}
        </Tag>
    );
};

// ============================================
// MINIMALIST TEMPLATE - "Stark"
// Pure black & white, Swiss design influence
// ============================================

export const MinimalistSlide: React.FC<{ slide: Slide; logoUrl?: string; onEdit?: (field: string, value: any) => void }> = ({ slide, logoUrl, onEdit }) => {
    const handleEdit = (field: string, value: string) => {
        if (onEdit) onEdit(field, value);
    };

    switch (slide.type) {
        case 'title':
            return (
                <div style={styles.min.titleSlide}>
                    {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 40, marginBottom: 40 }} />}
                    <EditableText
                        tagName="h1"
                        style={styles.min.titleMain}
                        value={slide.title || ''}
                        onChange={(val) => handleEdit('title', val)}
                    />
                    <EditableText
                        tagName="p"
                        style={styles.min.titleSub}
                        value={slide.subtitle || ''}
                        onChange={(val) => handleEdit('subtitle', val)}
                    />
                </div>
            );
        case 'statement':
            return (
                <div style={styles.min.statementSlide}>
                    <EditableText
                        tagName="p"
                        style={styles.min.statementText}
                        value={slide.text || ''}
                        onChange={(val) => handleEdit('text', val)}
                    />
                </div>
            );
        case 'two-column':
            return (
                <div style={styles.min.twoColSlide}>
                    <EditableText
                        tagName="h2"
                        style={styles.min.twoColTitle}
                        value={slide.title || ''}
                        onChange={(val) => handleEdit('title', val)}
                    />
                    <div style={styles.min.twoColContainer}>
                        <div style={styles.min.column}>
                            {Array.isArray(slide.left) && slide.left.map((item, i) => (
                                <EditableText
                                    key={i}
                                    tagName="p"
                                    style={styles.min.columnItem}
                                    value={item}
                                    onChange={(val) => {
                                        const newLeft = [...(slide.left as string[])];
                                        newLeft[i] = val;
                                        handleEdit('left', newLeft as any);
                                    }}
                                />
                            ))}
                            {/* Handle image placeholder if it's a string (though usually array for two-col) */}
                            {!Array.isArray(slide.left) && typeof slide.left === 'string' && (
                                <img src={slide.left} alt="Left content" style={{ maxWidth: '100%', borderRadius: 8 }} />
                            )}
                        </div>
                        <div style={styles.min.columnDivider} />
                        <div style={styles.min.column}>
                            {Array.isArray(slide.right) && slide.right.map((item, i) => (
                                <EditableText
                                    key={i}
                                    tagName="p"
                                    style={styles.min.columnItem}
                                    value={item}
                                    onChange={(val) => {
                                        const newRight = [...(slide.right as string[])];
                                        newRight[i] = val;
                                        handleEdit('right', newRight as any);
                                    }}
                                />
                            ))}
                            {!Array.isArray(slide.right) && typeof slide.right === 'string' && (
                                <img src={slide.right} alt="Right content" style={{ maxWidth: '100%', borderRadius: 8 }} />
                            )}
                        </div>
                    </div>
                </div>
            );
        case 'quote':
            return (
                <div style={styles.min.quoteSlide}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <EditableText
                            tagName="p"
                            style={styles.min.quoteText}
                            value={`"${slide.text}"`}
                            onChange={(val) => handleEdit('text', val.replace(/^"|"$/g, ''))}
                        />
                    </div>
                    <EditableText
                        tagName="p"
                        style={styles.min.quoteAuthor}
                        value={`— ${slide.author}`}
                        onChange={(val) => handleEdit('author', val.replace(/^—\s*/, ''))}
                    />
                </div>
            );
        case 'end':
            return (
                <div style={styles.min.endSlide}>
                    <EditableText
                        tagName="p"
                        style={styles.min.endText}
                        value={slide.text || slide.title || ''}
                        onChange={(val) => handleEdit(slide.text ? 'text' : 'title', val)}
                    />
                </div>
            );
        default:
            return (
                <div style={styles.min.statementSlide}>
                    <EditableText
                        tagName="h2"
                        style={styles.min.twoColTitle}
                        value={slide.title || ''}
                        onChange={(val) => handleEdit('title', val)}
                    />
                    <EditableText
                        tagName="p"
                        style={styles.min.statementText}
                        value={slide.text || slide.detail || ''}
                        onChange={(val) => handleEdit(slide.text ? 'text' : 'detail', val)}
                    />
                </div>
            );
    }
};

export const MinimalistTemplate: React.FC<TemplateProps & { onEdit?: (slideIndex: number, field: string, value: any) => void }> = ({ slides, logoUrl, isFullscreen, onEdit, onAdd, onDelete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Ensure currentSlide is valid if slides are deleted
    useEffect(() => {
        if (currentSlide >= slides.length && slides.length > 0) {
            setCurrentSlide(slides.length - 1);
        }
    }, [slides.length, currentSlide]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only navigate if not editing (active element is body)
            if (document.activeElement === document.body) {
                if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
                if (e.key === 'ArrowLeft') prevSlide();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length, nextSlide, prevSlide]);

    const renderSlide = (slide: Slide) => {
        if (!slide) return null;
        return <MinimalistSlide
            slide={slide}
            logoUrl={logoUrl}
            onEdit={(field, val) => onEdit && onEdit(currentSlide, field, val)}
        />;
    };

    if (slides.length === 0) return <div style={{ color: '#666' }}>No slides</div>;

    return (
        <div style={styles.min.container} className="slide-container">
            <GlobalStyles />
            <div style={styles.min.slideContainer}>
                {renderSlide(slides[currentSlide])}
            </div>

            {/* External Navigation Arrows */}
            {/* @ts-ignore */}
            <button onClick={prevSlide} style={getArrowStyles('left', isFullscreen)}>←</button>
            {/* @ts-ignore */}
            <button onClick={nextSlide} style={getArrowStyles('right', isFullscreen)}>→</button>

            {/* Slide Management Buttons */}
            {!isFullscreen && (
                <>
                    <button
                        className="slide-action-btn"
                        onClick={() => onDelete && onDelete(currentSlide)}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            background: '#FF6B6B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            zIndex: 100,
                        }}
                        title="Delete Slide"
                    >
                        🗑️
                    </button>
                </>
            )}

            <div style={styles.min.nav}>
                <span style={styles.min.slideNum}>{currentSlide + 1} / {slides.length}</span>
                {!isFullscreen && onAdd && (
                    <button
                        onClick={() => onAdd(currentSlide)}
                        style={{
                            background: '#4A9B8C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            marginLeft: 10,
                        }}
                        title="Add Slide"
                    >
                        +
                    </button>
                )}
            </div>
            {!isFullscreen && <div style={styles.min.label}>MINIMALIST — &quot;Stark&quot;</div>}
        </div>
    );
};

// ============================================
// HYBRID TEMPLATE - "Kinetic"
// Minimalist + accent line + static keyword balls on title
// ============================================

export const HybridSlide: React.FC<{ slide: Slide; accentColor: string; logoUrl?: string; onEdit?: (field: string, value: any) => void }> = ({ slide, accentColor, logoUrl, onEdit }) => {
    const handleEdit = (field: string, value: string) => {
        if (onEdit) onEdit(field, value);
    };

    switch (slide.type) {
        case 'title':
            return (
                <div style={styles.hyb.titleSlide}>
                    {/* Decorative Circle */}
                    <div style={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: accentColor,
                        opacity: 0.1,
                        zIndex: 0,
                    }} />

                    <div style={styles.hyb.titleContent}>
                        {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 32, marginBottom: 24 }} />}
                        <EditableText
                            tagName="h1"
                            style={styles.hyb.titleMain}
                            value={slide.title || ''}
                            onChange={(val) => handleEdit('title', val)}
                        />
                        <div style={{ width: 60, height: 4, background: accentColor, marginTop: 30 }} />
                        <EditableText
                            tagName="p"
                            style={styles.hyb.titleSub}
                            value={slide.subtitle || ''}
                            onChange={(val) => handleEdit('subtitle', val)}
                        />
                    </div>
                </div>
            );
        case 'statement':
            return (
                <div style={styles.hyb.statementSlide}>
                    <EditableText
                        tagName="p"
                        style={styles.hyb.statementText}
                        value={slide.text || ''}
                        onChange={(val) => handleEdit('text', val)}
                    />
                </div>
            );
        case 'two-column':
            return (
                <div style={styles.hyb.twoColSlide}>
                    <EditableText
                        tagName="h2"
                        style={{ ...styles.hyb.twoColTitle, color: accentColor }}
                        value={slide.title || ''}
                        onChange={(val) => handleEdit('title', val)}
                    />
                    <div style={styles.hyb.twoColContainer}>
                        <div style={styles.hyb.column}>
                            <span style={{ ...styles.hyb.columnLabel, color: accentColor }}>Key Points</span>
                            {Array.isArray(slide.left) && slide.left.map((item, i) => (
                                <EditableText
                                    key={i}
                                    tagName="p"
                                    style={styles.hyb.columnItem}
                                    value={item}
                                    onChange={(val) => {
                                        const newLeft = [...(slide.left as string[])];
                                        newLeft[i] = val;
                                        handleEdit('left', newLeft as any);
                                    }}
                                />
                            ))}
                            {!Array.isArray(slide.left) && typeof slide.left === 'string' && (
                                <img src={slide.left} alt="Left content" style={{ maxWidth: '100%', borderRadius: 8 }} />
                            )}
                        </div>
                        <div style={{ ...styles.hyb.columnDivider, background: accentColor }} />
                        <div style={styles.hyb.column}>
                            <span style={{ ...styles.hyb.columnLabel, color: accentColor }}>Details</span>
                            {Array.isArray(slide.right) && slide.right.map((item, i) => (
                                <EditableText
                                    key={i}
                                    tagName="p"
                                    style={styles.hyb.columnItem}
                                    value={item}
                                    onChange={(val) => {
                                        const newRight = [...(slide.right as string[])];
                                        newRight[i] = val;
                                        handleEdit('right', newRight as any);
                                    }}
                                />
                            ))}
                            {!Array.isArray(slide.right) && typeof slide.right === 'string' && (
                                <img src={slide.right} alt="Right content" style={{ maxWidth: '100%', borderRadius: 8 }} />
                            )}
                        </div>
                    </div>
                </div>
            );
        case 'quote':
            return (
                <div style={styles.hyb.quoteSlide}>
                    <div style={{ fontSize: 60, color: accentColor, lineHeight: 0.5, marginBottom: 20 }}>“</div>
                    <EditableText
                        tagName="p"
                        style={styles.hyb.quoteText}
                        value={slide.text || ''}
                        onChange={(val) => handleEdit('text', val)}
                    />
                    <EditableText
                        tagName="p"
                        style={{ ...styles.hyb.quoteAuthor, color: accentColor }}
                        value={`— ${slide.author}`}
                        onChange={(val) => handleEdit('author', val.replace(/^—\s*/, ''))}
                    />
                </div>
            );
        case 'end':
            return (
                <div style={styles.hyb.endSlide}>
                    <EditableText
                        tagName="p"
                        style={styles.hyb.endText}
                        value={slide.text || slide.title || ''}
                        onChange={(val) => handleEdit(slide.text ? 'text' : 'title', val)}
                    />
                    <div style={{ width: 80, height: 4, background: accentColor, margin: '30px auto' }} />
                </div>
            );
        default:
            return (
                <div style={styles.hyb.statementSlide}>
                    <EditableText
                        tagName="h2"
                        style={{ ...styles.hyb.twoColTitle, color: accentColor }}
                        value={slide.title || ''}
                        onChange={(val) => handleEdit('title', val)}
                    />
                    <EditableText
                        tagName="p"
                        style={styles.hyb.statementText}
                        value={slide.text || slide.detail || ''}
                        onChange={(val) => handleEdit(slide.text ? 'text' : 'detail', val)}
                    />
                </div>
            );
    }
};

export const HybridTemplate: React.FC<TemplateProps & { onEdit?: (slideIndex: number, field: string, value: any) => void }> = ({ slides, accentColor = '#0052CC', isFullscreen, onEdit, onAdd, onDelete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Ensure currentSlide is valid if slides are deleted
    useEffect(() => {
        if (currentSlide >= slides.length && slides.length > 0) {
            setCurrentSlide(slides.length - 1);
        }
    }, [slides.length, currentSlide]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement === document.body) {
                if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
                if (e.key === 'ArrowLeft') prevSlide();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length, nextSlide, prevSlide]);

    const renderSlide = () => {
        const slide = slides[currentSlide];
        if (!slide) return null;
        return <HybridSlide
            slide={slide}
            accentColor={accentColor}
            onEdit={(field, val) => onEdit && onEdit(currentSlide, field, val)}
        />;
    };

    if (slides.length === 0) return <div style={{ color: '#666' }}>No slides</div>;

    return (
        <div style={styles.hyb.container} className="slide-container">
            <GlobalStyles />
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}>
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

                {/* Slide Management Buttons */}
                {!isFullscreen && (
                    <>
                        <button
                            className="slide-action-btn"
                            onClick={() => onDelete && onDelete(currentSlide)}
                            style={{
                                position: 'absolute',
                                top: 20,
                                right: 20,
                                background: '#FF6B6B',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                zIndex: 100,
                            }}
                            title="Delete Slide"
                        >
                            🗑️
                        </button>
                    </>
                )}

                <div style={styles.hyb.nav}>
                    <span style={styles.hyb.slideNum}>{currentSlide + 1} / {slides.length}</span>
                    {!isFullscreen && onAdd && (
                        <button
                            onClick={() => onAdd(currentSlide)}
                            style={{
                                background: accentColor,
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                marginLeft: 10,
                            }}
                            title="Add Slide"
                        >
                            +
                        </button>
                    )}
                </div>
                {!isFullscreen && <div style={styles.hyb.label}>HYBRID — &quot;Kinetic&quot;</div>}
            </div>

            {/* External Navigation Arrows */}
            {/* @ts-ignore */}
            <button onClick={prevSlide} style={isFullscreen ? getArrowStyles('left', true) : { ...getArrowStyles('left', false), color: accentColor, borderColor: accentColor }}>←</button>
            {/* @ts-ignore */}
            <button onClick={nextSlide} style={isFullscreen ? getArrowStyles('right', true) : { ...getArrowStyles('right', false), color: accentColor, borderColor: accentColor }}>→</button>
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

export const MaximalistSlide: React.FC<{ slide: Slide; logoUrl?: string; onEdit?: (field: string, value: any) => void }> = ({ slide, logoUrl, onEdit }) => {
    const handleEdit = (field: string, value: any) => {
        if (onEdit) onEdit(field, value);
    };

    const colors = {
        pink: '#FF90E8',
        yellow: '#FFC900',
        cyan: '#23A094',
        blue: '#0090FF',
        green: '#B5E48C'
    };

    switch (slide.type) {
        case 'title':
            return (
                <div style={{ ...styles.max.contentLayer, background: colors.yellow }}>
                    <div style={styles.max.titleContent}>
                        {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 60, marginBottom: 30 }} />}
                        <EditableText
                            tagName="h1"
                            style={styles.max.titleMain}
                            value={slide.title || ''}
                            onChange={(val) => handleEdit('title', val)}
                        />
                        <EditableText
                            tagName="p"
                            style={styles.max.titleSub}
                            value={slide.subtitle || ''}
                            onChange={(val) => handleEdit('subtitle', val)}
                        />
                    </div>
                </div>
            );
        case 'big-number':
            return (
                <div style={{ ...styles.max.contentLayer, background: colors.pink }}>
                    <div style={styles.max.bigNumContent}>
                        <EditableText
                            tagName="span"
                            style={styles.max.bigNum}
                            value={slide.number || ''}
                            onChange={(val) => handleEdit('number', val)}
                        />
                        <EditableText
                            tagName="h3"
                            style={styles.max.bigNumLabel}
                            value={slide.label || ''}
                            onChange={(val) => handleEdit('label', val)}
                        />
                        <EditableText
                            tagName="p"
                            style={styles.max.bigNumDetail}
                            value={slide.detail || ''}
                            onChange={(val) => handleEdit('detail', val)}
                        />
                    </div>
                </div>
            );
        case 'grid':
            return (
                <div style={{ ...styles.max.contentLayer, background: '#fff' }}>
                    <div style={styles.max.gridContent}>
                        <EditableText
                            tagName="h2"
                            style={styles.max.gridTitle}
                            value={slide.title || ''}
                            onChange={(val) => handleEdit('title', val)}
                        />
                        <div style={styles.max.gridContainer}>
                            {slide.items?.map((item, i) => (
                                <div key={i} style={{ ...styles.max.gridItem, background: [colors.pink, colors.yellow, colors.cyan, colors.green][i % 4] }}>
                                    <span style={styles.max.gridIcon}>
                                        {/* Check if icon is an image URL (placeholder replacement) */}
                                        {item.icon && (item.icon.startsWith('http') || item.icon.startsWith('blob')) ? (
                                            <img src={item.icon} alt="icon" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                        ) : (
                                            item.icon
                                        )}
                                    </span>
                                    <EditableText
                                        tagName="span"
                                        style={styles.max.gridLabel}
                                        value={item.label}
                                        onChange={(val) => {
                                            const newItems = [...(slide.items || [])];
                                            newItems[i] = { ...newItems[i], label: val };
                                            handleEdit('items', newItems as any);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case 'split':
            const leftData = slide.left as { title: string; value: string; label: string } | undefined;
            const rightData = slide.right as { title: string; value: string; label: string } | undefined;
            return (
                <div style={styles.max.splitContent}>
                    <div style={{ ...styles.max.splitHalf, background: colors.blue }}>
                        <EditableText
                            tagName="span"
                            style={styles.max.splitTitle}
                            value={leftData?.title || ''}
                            onChange={(val) => handleEdit('left', { ...leftData, title: val })}
                        />
                        <EditableText
                            tagName="span"
                            style={styles.max.splitValue}
                            value={leftData?.value || ''}
                            onChange={(val) => handleEdit('left', { ...leftData, value: val })}
                        />
                        <EditableText
                            tagName="span"
                            style={styles.max.splitLabel}
                            value={leftData?.label || ''}
                            onChange={(val) => handleEdit('left', { ...leftData, label: val })}
                        />
                    </div>
                    <div style={styles.max.splitDivider}>
                        <div style={{ ...styles.max.splitArrowCircle, background: colors.yellow }}>VS</div>
                    </div>
                    <div style={{ ...styles.max.splitHalf, background: '#1a1a1a' }}>
                        <EditableText
                            tagName="span"
                            style={styles.max.splitTitle}
                            value={rightData?.title || ''}
                            onChange={(val) => handleEdit('right', { ...rightData, title: val })}
                        />
                        <EditableText
                            tagName="span"
                            style={styles.max.splitValue}
                            value={rightData?.value || ''}
                            onChange={(val) => handleEdit('right', { ...rightData, value: val })}
                        />
                        <EditableText
                            tagName="span"
                            style={styles.max.splitLabel}
                            value={rightData?.label || ''}
                            onChange={(val) => handleEdit('right', { ...rightData, label: val })}
                        />
                    </div>
                </div>
            );
        case 'end':
            return (
                <div style={{ ...styles.max.contentLayer, background: colors.cyan }}>
                    <div style={styles.max.endContent}>
                        <EditableText
                            tagName="h1"
                            style={styles.max.endTitle}
                            value={slide.title || ''}
                            onChange={(val) => handleEdit('title', val)}
                        />
                        <button style={{ ...styles.max.ctaBtn, background: '#1a1a1a' }}>
                            <EditableText
                                tagName="span"
                                value={slide.cta || 'Contact Us'}
                                onChange={(val) => handleEdit('cta', val)}
                            />
                        </button>
                    </div>
                </div>
            );
        default:
            return (
                <div style={{ ...styles.max.contentLayer, background: colors.yellow }}>
                    <div style={styles.max.titleContent}>
                        <EditableText
                            tagName="h1"
                            style={styles.max.titleMain}
                            value={slide.title || ''}
                            onChange={(val) => handleEdit('title', val)}
                        />
                        <EditableText
                            tagName="p"
                            style={styles.max.titleSub}
                            value={slide.text || ''}
                            onChange={(val) => handleEdit('text', val)}
                        />
                    </div>
                </div>
            );
    }
};

export const MaximalistTemplate: React.FC<TemplateProps & { onEdit?: (slideIndex: number, field: string, value: any) => void }> = ({ slides, logoUrl, isFullscreen, onEdit, onAdd, onDelete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Ensure currentSlide is valid if slides are deleted
    useEffect(() => {
        if (currentSlide >= slides.length && slides.length > 0) {
            setCurrentSlide(slides.length - 1);
        }
    }, [slides.length, currentSlide]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement === document.body) {
                if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
                if (e.key === 'ArrowLeft') prevSlide();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length, nextSlide, prevSlide]);

    const colors = {
        pink: '#FF90E8',
        yellow: '#FFC900',
        cyan: '#23A094',
        blue: '#0090FF',
        green: '#B5E48C'
    };

    const renderSlide = (slide: Slide) => {
        if (!slide) return null;
        return <MaximalistSlide
            slide={slide}
            logoUrl={logoUrl}
            onEdit={(field, val) => onEdit && onEdit(currentSlide, field, val)}
        />;
    };

    if (slides.length === 0) return <div style={{ color: '#666' }}>No slides</div>;

    return (
        <div style={styles.max.container} className="slide-container">
            <GlobalStyles />
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}>
                <div style={styles.max.slideContainer}>
                    {renderSlide(slides[currentSlide])}
                </div>

                {/* Slide Management Buttons */}
                {!isFullscreen && (
                    <>
                        <button
                            className="slide-action-btn"
                            onClick={() => onDelete && onDelete(currentSlide)}
                            style={{
                                position: 'absolute',
                                top: 20,
                                right: 20,
                                background: '#FF6B6B',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                zIndex: 100,
                            }}
                            title="Delete Slide"
                        >
                            🗑️
                        </button>
                    </>
                )}

                <div style={styles.max.nav}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{currentSlide + 1} / {slides.length}</span>
                    {!isFullscreen && onAdd && (
                        <button
                            onClick={() => onAdd(currentSlide)}
                            style={{
                                background: '#1a1a1a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                marginLeft: 10,
                            }}
                            title="Add Slide"
                        >
                            +
                        </button>
                    )}
                </div>
                {!isFullscreen && <div style={styles.max.label}>MAXIMALIST — &quot;Bold&quot;</div>}
            </div>

            {/* External Navigation Arrows */}
            {/* @ts-ignore */}
            <button onClick={prevSlide} style={isFullscreen ? getArrowStyles('left', true) : { ...getArrowStyles('left', false), background: colors.pink, border: 'none', color: 'white' }}>←</button>
            {/* @ts-ignore */}
            <button onClick={nextSlide} style={isFullscreen ? getArrowStyles('right', true) : { ...getArrowStyles('right', false), background: colors.green, border: 'none', color: 'white' }}>→</button>
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
            width: 960,
            height: 540,
            background: '#fff',
            position: 'relative',
            fontFamily: baseFont,
            // overflow: 'hidden', // Allow arrows to be outside
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            borderRadius: 16,
        },
        slideContainer: {
            width: '100%',
            height: 540,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            boxSizing: 'border-box',
            overflow: 'hidden', // Clip content here instead
            borderRadius: 16,
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
            right: 30, // Move to bottom right
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            zIndex: 10,
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
        },
    },
    // Shared Arrow Styles
    navArrowLeft: {
        position: 'absolute',
        top: '50%',
        left: -80,
        transform: 'translateY(-50%)',
        background: 'white',
        border: '1px solid #ddd',
        width: 50,
        height: 50,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
        zIndex: 100,
    },
    navArrowRight: {
        position: 'absolute',
        top: '50%',
        right: -80,
        transform: 'translateY(-50%)',
        background: 'white',
        border: '1px solid #ddd',
        width: 50,
        height: 50,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
        zIndex: 100,
    },


    // Hybrid Styles
    hyb: {
        container: {
            width: 960,
            height: 540,
            background: '#fff',
            position: 'relative',
            fontFamily: baseFont,
            // overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            borderRadius: 16,
        },
        slideContainer: {
            width: '100%',
            height: 540,
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
            width: 960,
            height: 540,
            background: '#FFFBF5',
            position: 'relative',
            fontFamily: baseFont,
            // overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            borderRadius: 16,
        },
        slideContainer: {
            width: '100%',
            height: 540,
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
