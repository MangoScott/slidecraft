import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Draggable from 'react-draggable';

// ============================================
// TYPES
// ============================================

export interface Slide {
    type: 'title' | 'statement' | 'two-column' | 'quote' | 'end' | 'big-number' | 'grid' | 'split' | 'content' | 'image';
    title?: string;
    subtitle?: string;
    text?: string;
    author?: string;
    keywords?: string[];
    // Image
    image?: string;
    caption?: string;
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
    // Customization
    positions?: { [key: string]: { x: number; y: number } };
    fontSizes?: { [key: string]: number };
    rotations?: { [key: string]: number };
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
    onAddImage?: (index: number, file: File) => void;
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
        return { ...base, left: isFullscreen ? 32 : 20 };
    } else {
        return { ...base, right: isFullscreen ? 32 : 20 };
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
    fontSize?: number;
    onFontSizeChange?: (size: number) => void;
    draggable?: boolean;
    position?: { x: number; y: number };
    onPositionChange?: (pos: { x: number; y: number }) => void;
    rotation?: number;
    onRotationChange?: (deg: number) => void;
}

const EditableText: React.FC<EditableTextProps> = ({
    value, onChange, style, tagName = 'p', className,
    fontSize, onFontSizeChange, draggable, position, onPositionChange,
    rotation, onRotationChange
}) => {
    const Tag = tagName as any;
    const [isFocused, setIsFocused] = useState(false);
    const nodeRef = useRef(null);

    const content = (
        <div style={{
            position: 'relative',
            display: 'inline-block',
            width: '100%',
            transform: `rotate(${rotation || 0}deg)`,
            transition: 'transform 0.2s'
        }}>
            {isFocused && (onFontSizeChange || onRotationChange) && (
                <div style={{
                    position: 'absolute', top: -45, right: 0,
                    background: '#1a1a1a', borderRadius: 8, padding: '6px 10px',
                    display: 'flex', gap: 12, zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    alignItems: 'center'
                }} onMouseDown={e => e.stopPropagation()}>
                    {onFontSizeChange && (
                        <>
                            <button
                                onClick={() => onFontSizeChange((fontSize || parseInt(style?.fontSize as string) || 16) - 2)}
                                style={{ color: 'white', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}
                                title="Decrease font size"
                            >
                                A-
                            </button>
                            <button
                                onClick={() => onFontSizeChange((fontSize || parseInt(style?.fontSize as string) || 16) + 2)}
                                style={{ color: 'white', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}
                                title="Increase font size"
                            >
                                A+
                            </button>
                        </>
                    )}
                    {onRotationChange && (
                        <>
                            <div style={{ width: 1, height: 16, background: '#444' }}></div>
                            <button
                                onClick={() => onRotationChange((rotation || 0) - 5)}
                                style={{ color: 'white', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}
                                title="Rotate left"
                            >
                                ↺
                            </button>
                            <button
                                onClick={() => onRotationChange((rotation || 0) + 5)}
                                style={{ color: 'white', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}
                                title="Rotate right"
                            >
                                ↻
                            </button>
                        </>
                    )}
                </div>
            )}
            <Tag
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setIsFocused(true)}
                onBlur={(e: React.FocusEvent<HTMLElement>) => {
                    setIsFocused(false);
                    onChange(e.currentTarget.textContent || '');
                }}
                style={{
                    ...style,
                    outline: isFocused ? '2px dashed rgba(74, 155, 140, 0.5)' : 'none',
                    cursor: 'text',
                    fontSize: fontSize || style?.fontSize,
                    transition: 'font-size 0.2s'
                }}
                className={`editable-text ${className || ''}`}
            >
                {value}
            </Tag>
        </div>
    );

    if (draggable && onPositionChange) {
        const hasBeenMoved = position && (position.x !== 0 || position.y !== 0);
        return (
            <Draggable
                nodeRef={nodeRef}
                position={position || { x: 0, y: 0 }}
                onStop={(e, data) => onPositionChange({ x: data.x, y: data.y })}
            >
                <div ref={nodeRef} style={{
                    position: hasBeenMoved ? 'absolute' : 'relative',
                    zIndex: hasBeenMoved ? 100 : 'auto',
                    cursor: 'move',
                    display: hasBeenMoved ? 'inline-block' : 'block'
                }}>
                    {content}
                </div>
            </Draggable>
        );
    }

    return content;
};

// ============================================
// MINIMALIST TEMPLATE - "Stark"
// Pure black & white, Swiss design influence
// ============================================

export const MinimalistSlide: React.FC<{ slide: Slide; logoUrl?: string; onEdit?: (field: string, value: any) => void }> = ({ slide, logoUrl, onEdit }) => {
    const handleEdit = (field: string, value: any) => {
        if (onEdit) onEdit(field, value);
    };

    const updatePos = (key: string, pos: { x: number; y: number }) => {
        handleEdit('positions', { ...slide.positions, [key]: pos });
    };
    const updateFS = (key: string, size: number) => {
        handleEdit('fontSizes', { ...slide.fontSizes, [key]: size });
    };
    const updateRot = (key: string, deg: number) => {
        handleEdit('rotations', { ...slide.rotations, [key]: deg });
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
                        fontSize={slide.fontSizes?.title}
                        onFontSizeChange={(s) => updateFS('title', s)}
                        draggable
                        position={slide.positions?.title}
                        onPositionChange={(p) => updatePos('title', p)}
                        rotation={slide.rotations?.title}
                        onRotationChange={(r) => updateRot('title', r)}
                    />
                    <EditableText
                        tagName="p"
                        style={styles.min.titleSub}
                        value={slide.subtitle || ''}
                        onChange={(val) => handleEdit('subtitle', val)}
                        fontSize={slide.fontSizes?.subtitle}
                        onFontSizeChange={(s) => updateFS('subtitle', s)}
                        draggable
                        position={slide.positions?.subtitle}
                        onPositionChange={(p) => updatePos('subtitle', p)}
                        rotation={slide.rotations?.subtitle}
                        onRotationChange={(r) => updateRot('subtitle', r)}
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
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
                    />
                </div>
            );
        case 'content':
            return (
                <div style={styles.min.contentSlide}>
                    <EditableText
                        tagName="h2"
                        style={styles.min.contentTitle}
                        value={slide.title || ''}
                        onChange={(val) => handleEdit('title', val)}
                        fontSize={slide.fontSizes?.title}
                        onFontSizeChange={(s) => updateFS('title', s)}
                        draggable
                        position={slide.positions?.title}
                        onPositionChange={(p) => updatePos('title', p)}
                        rotation={slide.rotations?.title}
                        onRotationChange={(r) => updateRot('title', r)}
                    />
                    <EditableText
                        tagName="p"
                        style={styles.min.contentText}
                        value={slide.text || ''}
                        onChange={(val) => handleEdit('text', val)}
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
                    />
                </div>
            );
        case 'image':
            return (
                <div style={styles.min.imageSlide}>
                    {slide.image && (
                        <img
                            src={slide.image}
                            alt="Slide"
                            style={{
                                maxWidth: '100%',
                                maxHeight: slide.caption ? '80%' : '100%',
                                objectFit: 'contain',
                                borderRadius: 8,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                            }}
                        />
                    )}
                    <EditableText
                        tagName="p"
                        style={styles.min.imageCaption}
                        value={slide.caption || ''}
                        onChange={(val) => handleEdit('caption', val)}
                        fontSize={slide.fontSizes?.caption}
                        onFontSizeChange={(s) => updateFS('caption', s)}
                        draggable
                        position={slide.positions?.caption}
                        onPositionChange={(p) => updatePos('caption', p)}
                        rotation={slide.rotations?.caption}
                        onRotationChange={(r) => updateRot('caption', r)}
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
                        fontSize={slide.fontSizes?.title}
                        onFontSizeChange={(s) => updateFS('title', s)}
                        draggable
                        position={slide.positions?.title}
                        onPositionChange={(p) => updatePos('title', p)}
                        rotation={slide.rotations?.title}
                        onRotationChange={(r) => updateRot('title', r)}
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
                                    fontSize={slide.fontSizes?.[`left_${i}`]}
                                    onFontSizeChange={(s) => updateFS(`left_${i}`, s)}
                                    draggable
                                    position={slide.positions?.[`left_${i}`]}
                                    onPositionChange={(p) => updatePos(`left_${i}`, p)}
                                    rotation={slide.rotations?.[`left_${i}`]}
                                    onRotationChange={(r) => updateRot(`left_${i}`, r)}
                                />
                            ))}
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
                                    fontSize={slide.fontSizes?.[`right_${i}`]}
                                    onFontSizeChange={(s) => updateFS(`right_${i}`, s)}
                                    draggable
                                    position={slide.positions?.[`right_${i}`]}
                                    onPositionChange={(p) => updatePos(`right_${i}`, p)}
                                    rotation={slide.rotations?.[`right_${i}`]}
                                    onRotationChange={(r) => updateRot(`right_${i}`, r)}
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
                            fontSize={slide.fontSizes?.text}
                            onFontSizeChange={(s) => updateFS('text', s)}
                            draggable
                            position={slide.positions?.text}
                            onPositionChange={(p) => updatePos('text', p)}
                            rotation={slide.rotations?.text}
                            onRotationChange={(r) => updateRot('text', r)}
                        />
                    </div>
                    <EditableText
                        tagName="p"
                        style={styles.min.quoteAuthor}
                        value={`— ${slide.author}`}
                        onChange={(val) => handleEdit('author', val.replace(/^—\s*/, ''))}
                        fontSize={slide.fontSizes?.author}
                        onFontSizeChange={(s) => updateFS('author', s)}
                        draggable
                        position={slide.positions?.author}
                        onPositionChange={(p) => updatePos('author', p)}
                        rotation={slide.rotations?.author}
                        onRotationChange={(r) => updateRot('author', r)}
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
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
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
                        fontSize={slide.fontSizes?.title}
                        onFontSizeChange={(s) => updateFS('title', s)}
                        draggable
                        position={slide.positions?.title}
                        onPositionChange={(p) => updatePos('title', p)}
                        rotation={slide.rotations?.title}
                        onRotationChange={(r) => updateRot('title', r)}
                    />
                    <EditableText
                        tagName="p"
                        style={styles.min.statementText}
                        value={slide.text || slide.detail || ''}
                        onChange={(val) => handleEdit(slide.text ? 'text' : 'detail', val)}
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
                    />
                </div>
            );
    }
};

export const MinimalistTemplate: React.FC<TemplateProps & { onEdit?: (slideIndex: number, field: string, value: any) => void }> = ({ slides, logoUrl, isFullscreen, onEdit, onAdd, onAddImage, onDelete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Ensure currentSlide is valid if slides are deleted
    useEffect(() => {
        if (currentSlide >= slides.length && slides.length > 0) {
            setCurrentSlide(slides.length - 1);
        }
    }, [slides.length, currentSlide]);

    // Auto-navigate to new slide
    const prevSlidesLength = useRef(slides.length);
    useEffect(() => {
        if (slides.length > prevSlidesLength.current) {
            setCurrentSlide(slides.length - 1);
        }
        prevSlidesLength.current = slides.length;
    }, [slides.length]);

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
                            background: 'white',
                            color: '#1a1a1a',
                            border: '1px solid #e0e0e0',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 10,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                        title="Add Text Slide"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.borderColor = '#1a1a1a';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                )}
                {!isFullscreen && onAddImage && (
                    <label
                        style={{
                            background: 'white',
                            color: '#1a1a1a',
                            border: '1px solid #e0e0e0',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 8,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                        title="Add Image Slide"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.borderColor = '#1a1a1a';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files?.[0] && onAddImage) {
                                    onAddImage(currentSlide, e.target.files[0]);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </label>
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
    const handleEdit = (field: string, value: any) => {
        if (onEdit) onEdit(field, value);
    };

    const updatePos = (key: string, pos: { x: number; y: number }) => {
        handleEdit('positions', { ...slide.positions, [key]: pos });
    };
    const updateFS = (key: string, size: number) => {
        handleEdit('fontSizes', { ...slide.fontSizes, [key]: size });
    };
    const updateRot = (key: string, deg: number) => {
        handleEdit('rotations', { ...slide.rotations, [key]: deg });
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
                            fontSize={slide.fontSizes?.title}
                            onFontSizeChange={(s) => updateFS('title', s)}
                            draggable
                            position={slide.positions?.title}
                            onPositionChange={(p) => updatePos('title', p)}
                            rotation={slide.rotations?.title}
                            onRotationChange={(r) => updateRot('title', r)}
                        />
                        <div style={{ width: 60, height: 4, background: accentColor, marginTop: 30 }} />
                        <EditableText
                            tagName="p"
                            style={styles.hyb.titleSub}
                            value={slide.subtitle || ''}
                            onChange={(val) => handleEdit('subtitle', val)}
                            fontSize={slide.fontSizes?.subtitle}
                            onFontSizeChange={(s) => updateFS('subtitle', s)}
                            draggable
                            position={slide.positions?.subtitle}
                            onPositionChange={(p) => updatePos('subtitle', p)}
                            rotation={slide.rotations?.subtitle}
                            onRotationChange={(r) => updateRot('subtitle', r)}
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
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
                    />
                </div>
            );
        case 'content':
            return (
                <div style={styles.hyb.contentSlide}>
                    <EditableText
                        tagName="h2"
                        style={{ ...styles.hyb.contentTitle, color: accentColor }}
                        value={slide.title || ''}
                        onChange={(val) => handleEdit('title', val)}
                        fontSize={slide.fontSizes?.title}
                        onFontSizeChange={(s) => updateFS('title', s)}
                        draggable
                        position={slide.positions?.title}
                        onPositionChange={(p) => updatePos('title', p)}
                        rotation={slide.rotations?.title}
                        onRotationChange={(r) => updateRot('title', r)}
                    />
                    <EditableText
                        tagName="p"
                        style={styles.hyb.contentText}
                        value={slide.text || ''}
                        onChange={(val) => handleEdit('text', val)}
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
                    />
                </div>
            );
        case 'image':
            return (
                <div style={styles.hyb.imageSlide}>
                    {slide.image && (
                        <img
                            src={slide.image}
                            alt="Slide"
                            style={{
                                maxWidth: '100%',
                                maxHeight: slide.caption ? '80%' : '100%',
                                objectFit: 'contain',
                                borderRadius: 8,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                border: `4px solid ${accentColor}`
                            }}
                        />
                    )}
                    <EditableText
                        tagName="p"
                        style={{ ...styles.hyb.imageCaption, color: accentColor }}
                        value={slide.caption || ''}
                        onChange={(val) => handleEdit('caption', val)}
                        fontSize={slide.fontSizes?.caption}
                        onFontSizeChange={(s) => updateFS('caption', s)}
                        draggable
                        position={slide.positions?.caption}
                        onPositionChange={(p) => updatePos('caption', p)}
                        rotation={slide.rotations?.caption}
                        onRotationChange={(r) => updateRot('caption', r)}
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
                        fontSize={slide.fontSizes?.title}
                        onFontSizeChange={(s) => updateFS('title', s)}
                        draggable
                        position={slide.positions?.title}
                        onPositionChange={(p) => updatePos('title', p)}
                        rotation={slide.rotations?.title}
                        onRotationChange={(r) => updateRot('title', r)}
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
                                    fontSize={slide.fontSizes?.[`left_${i}`]}
                                    onFontSizeChange={(s) => updateFS(`left_${i}`, s)}
                                    draggable
                                    position={slide.positions?.[`left_${i}`]}
                                    onPositionChange={(p) => updatePos(`left_${i}`, p)}
                                    rotation={slide.rotations?.[`left_${i}`]}
                                    onRotationChange={(r) => updateRot(`left_${i}`, r)}
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
                                    fontSize={slide.fontSizes?.[`right_${i}`]}
                                    onFontSizeChange={(s) => updateFS(`right_${i}`, s)}
                                    draggable
                                    position={slide.positions?.[`right_${i}`]}
                                    onPositionChange={(p) => updatePos(`right_${i}`, p)}
                                    rotation={slide.rotations?.[`right_${i}`]}
                                    onRotationChange={(r) => updateRot(`right_${i}`, r)}
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
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
                    />
                    <EditableText
                        tagName="p"
                        style={{ ...styles.hyb.quoteAuthor, color: accentColor }}
                        value={`— ${slide.author}`}
                        onChange={(val) => handleEdit('author', val.replace(/^—\s*/, ''))}
                        fontSize={slide.fontSizes?.author}
                        onFontSizeChange={(s) => updateFS('author', s)}
                        draggable
                        position={slide.positions?.author}
                        onPositionChange={(p) => updatePos('author', p)}
                        rotation={slide.rotations?.author}
                        onRotationChange={(r) => updateRot('author', r)}
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
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
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
                        fontSize={slide.fontSizes?.title}
                        onFontSizeChange={(s) => updateFS('title', s)}
                        draggable
                        position={slide.positions?.title}
                        onPositionChange={(p) => updatePos('title', p)}
                        rotation={slide.rotations?.title}
                        onRotationChange={(r) => updateRot('title', r)}
                    />
                    <EditableText
                        tagName="p"
                        style={styles.hyb.statementText}
                        value={slide.text || slide.detail || ''}
                        onChange={(val) => handleEdit(slide.text ? 'text' : 'detail', val)}
                        fontSize={slide.fontSizes?.text}
                        onFontSizeChange={(s) => updateFS('text', s)}
                        draggable
                        position={slide.positions?.text}
                        onPositionChange={(p) => updatePos('text', p)}
                        rotation={slide.rotations?.text}
                        onRotationChange={(r) => updateRot('text', r)}
                    />
                </div>
            );
    }
};

export const HybridTemplate: React.FC<TemplateProps & { onEdit?: (slideIndex: number, field: string, value: any) => void }> = ({ slides, accentColor = '#0052CC', isFullscreen, onEdit, onAdd, onAddImage, onDelete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Ensure currentSlide is valid if slides are deleted
    useEffect(() => {
        if (currentSlide >= slides.length && slides.length > 0) {
            setCurrentSlide(slides.length - 1);
        }
    }, [slides.length, currentSlide]);

    // Auto-navigate to new slide
    const prevSlidesLength = useRef(slides.length);
    useEffect(() => {
        if (slides.length > prevSlidesLength.current) {
            setCurrentSlide(slides.length - 1);
        }
        prevSlidesLength.current = slides.length;
    }, [slides.length]);

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
                                background: 'white',
                                color: '#1a1a1a',
                                border: '1px solid #e0e0e0',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 10,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s'
                            }}
                            title="Add Text Slide"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.borderColor = accentColor;
                                e.currentTarget.style.color = accentColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = '#e0e0e0';
                                e.currentTarget.style.color = '#1a1a1a';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    )}
                    {!isFullscreen && onAddImage && (
                        <label
                            style={{
                                background: 'white',
                                color: '#1a1a1a',
                                border: '1px solid #e0e0e0',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 8,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s'
                            }}
                            title="Add Image Slide"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.borderColor = accentColor;
                                e.currentTarget.style.color = accentColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = '#e0e0e0';
                                e.currentTarget.style.color = '#1a1a1a';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    if (e.target.files?.[0] && onAddImage) {
                                        onAddImage(currentSlide, e.target.files[0]);
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </label>
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
        green: '#B5E48C',
        orange: '#FF6B35',
        purple: '#9B59B6',
    };

    // Physics shapes for background
    const [shapes, setShapes] = useState<Shape[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);

    // Initialize shapes
    useEffect(() => {
        const colorArray = Object.values(colors);
        const newShapes: Shape[] = [];

        for (let i = 0; i < 8; i++) {
            const size = 40 + Math.random() * 80;
            const isCircle = Math.random() > 0.3;

            newShapes.push({
                id: i,
                x: 50 + Math.random() * 860,
                y: 50 + Math.random() * 440,
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
    }, [slide.type]);

    // Animation loop
    useEffect(() => {
        const width = 960;
        const height = 540;
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
    }, [slide.type]);

    const renderContent = () => {
        const updatePos = (key: string, pos: { x: number; y: number }) => {
            handleEdit('positions', { ...slide.positions, [key]: pos });
        };
        const updateFS = (key: string, size: number) => {
            handleEdit('fontSizes', { ...slide.fontSizes, [key]: size });
        };
        const updateRot = (key: string, deg: number) => {
            handleEdit('rotations', { ...slide.rotations, [key]: deg });
        };

        switch (slide.type) {
            case 'title':
                return (
                    <div style={styles.max.contentLayer}>
                        <div style={styles.max.titleContent}>
                            {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 60, marginBottom: 30 }} />}
                            <EditableText
                                tagName="h1"
                                style={styles.max.titleMain}
                                value={slide.title || ''}
                                onChange={(val) => handleEdit('title', val)}
                                fontSize={slide.fontSizes?.title}
                                onFontSizeChange={(s) => updateFS('title', s)}
                                draggable
                                position={slide.positions?.title}
                                onPositionChange={(p) => updatePos('title', p)}
                                rotation={slide.rotations?.title}
                                onRotationChange={(r) => updateRot('title', r)}
                            />
                            <EditableText
                                tagName="p"
                                style={styles.max.titleSub}
                                value={slide.subtitle || ''}
                                onChange={(val) => handleEdit('subtitle', val)}
                                fontSize={slide.fontSizes?.subtitle}
                                onFontSizeChange={(s) => updateFS('subtitle', s)}
                                draggable
                                position={slide.positions?.subtitle}
                                onPositionChange={(p) => updatePos('subtitle', p)}
                                rotation={slide.rotations?.subtitle}
                                onRotationChange={(r) => updateRot('subtitle', r)}
                            />
                        </div>
                    </div>
                );
            case 'big-number':
                return (
                    <div style={styles.max.contentLayer}>
                        <div style={styles.max.bigNumContent}>
                            <EditableText
                                tagName="span"
                                style={styles.max.bigNum}
                                value={slide.number || ''}
                                onChange={(val) => handleEdit('number', val)}
                                fontSize={slide.fontSizes?.number}
                                onFontSizeChange={(s) => updateFS('number', s)}
                                draggable
                                position={slide.positions?.number}
                                onPositionChange={(p) => updatePos('number', p)}
                                rotation={slide.rotations?.number}
                                onRotationChange={(r) => updateRot('number', r)}
                            />
                            <EditableText
                                tagName="h3"
                                style={styles.max.bigNumLabel}
                                value={slide.label || ''}
                                onChange={(val) => handleEdit('label', val)}
                                fontSize={slide.fontSizes?.label}
                                onFontSizeChange={(s) => updateFS('label', s)}
                                draggable
                                position={slide.positions?.label}
                                onPositionChange={(p) => updatePos('label', p)}
                                rotation={slide.rotations?.label}
                                onRotationChange={(r) => updateRot('label', r)}
                            />
                            <EditableText
                                tagName="p"
                                style={styles.max.bigNumDetail}
                                value={slide.detail || ''}
                                onChange={(val) => handleEdit('detail', val)}
                                fontSize={slide.fontSizes?.detail}
                                onFontSizeChange={(s) => updateFS('detail', s)}
                                draggable
                                position={slide.positions?.detail}
                                onPositionChange={(p) => updatePos('detail', p)}
                                rotation={slide.rotations?.detail}
                                onRotationChange={(r) => updateRot('detail', r)}
                            />
                        </div>
                    </div>
                );
            case 'grid':
                return (
                    <div style={styles.max.contentLayer}>
                        <div style={styles.max.gridContent}>
                            <EditableText
                                tagName="h2"
                                style={styles.max.gridTitle}
                                value={slide.title || ''}
                                onChange={(val) => handleEdit('title', val)}
                                fontSize={slide.fontSizes?.title}
                                onFontSizeChange={(s) => updateFS('title', s)}
                                draggable
                                position={slide.positions?.title}
                                onPositionChange={(p) => updatePos('title', p)}
                                rotation={slide.rotations?.title}
                                onRotationChange={(r) => updateRot('title', r)}
                            />
                            <div style={styles.max.gridContainer}>
                                {slide.items?.map((item, i) => (
                                    <div key={i} style={{ ...styles.max.gridItem, background: [colors.pink, colors.yellow, colors.cyan, colors.green][i % 4] }}>
                                        <span style={styles.max.gridIcon}>
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
                                            fontSize={slide.fontSizes?.[`grid_${i}`]}
                                            onFontSizeChange={(s) => updateFS(`grid_${i}`, s)}
                                            draggable
                                            position={slide.positions?.[`grid_${i}`]}
                                            onPositionChange={(p) => updatePos(`grid_${i}`, p)}
                                            rotation={slide.rotations?.[`grid_${i}`]}
                                            onRotationChange={(r) => updateRot(`grid_${i}`, r)}
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
                                fontSize={slide.fontSizes?.leftTitle}
                                onFontSizeChange={(s) => updateFS('leftTitle', s)}
                                draggable
                                position={slide.positions?.leftTitle}
                                onPositionChange={(p) => updatePos('leftTitle', p)}
                                rotation={slide.rotations?.leftTitle}
                                onRotationChange={(r) => updateRot('leftTitle', r)}
                            />
                            <EditableText
                                tagName="span"
                                style={styles.max.splitValue}
                                value={leftData?.value || ''}
                                onChange={(val) => handleEdit('left', { ...leftData, value: val })}
                                fontSize={slide.fontSizes?.leftValue}
                                onFontSizeChange={(s) => updateFS('leftValue', s)}
                                draggable
                                position={slide.positions?.leftValue}
                                onPositionChange={(p) => updatePos('leftValue', p)}
                                rotation={slide.rotations?.leftValue}
                                onRotationChange={(r) => updateRot('leftValue', r)}
                            />
                            <EditableText
                                tagName="span"
                                style={styles.max.splitLabel}
                                value={leftData?.label || ''}
                                onChange={(val) => handleEdit('left', { ...leftData, label: val })}
                                fontSize={slide.fontSizes?.leftLabel}
                                onFontSizeChange={(s) => updateFS('leftLabel', s)}
                                draggable
                                position={slide.positions?.leftLabel}
                                onPositionChange={(p) => updatePos('leftLabel', p)}
                                rotation={slide.rotations?.leftLabel}
                                onRotationChange={(r) => updateRot('leftLabel', r)}
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
                                fontSize={slide.fontSizes?.rightTitle}
                                onFontSizeChange={(s) => updateFS('rightTitle', s)}
                                draggable
                                position={slide.positions?.rightTitle}
                                onPositionChange={(p) => updatePos('rightTitle', p)}
                                rotation={slide.rotations?.rightTitle}
                                onRotationChange={(r) => updateRot('rightTitle', r)}
                            />
                            <EditableText
                                tagName="span"
                                style={styles.max.splitValue}
                                value={rightData?.value || ''}
                                onChange={(val) => handleEdit('right', { ...rightData, value: val })}
                                fontSize={slide.fontSizes?.rightValue}
                                onFontSizeChange={(s) => updateFS('rightValue', s)}
                                draggable
                                position={slide.positions?.rightValue}
                                onPositionChange={(p) => updatePos('rightValue', p)}
                                rotation={slide.rotations?.rightValue}
                                onRotationChange={(r) => updateRot('rightValue', r)}
                            />
                            <EditableText
                                tagName="span"
                                style={styles.max.splitLabel}
                                value={rightData?.label || ''}
                                onChange={(val) => handleEdit('right', { ...rightData, label: val })}
                                fontSize={slide.fontSizes?.rightLabel}
                                onFontSizeChange={(s) => updateFS('rightLabel', s)}
                                draggable
                                position={slide.positions?.rightLabel}
                                onPositionChange={(p) => updatePos('rightLabel', p)}
                                rotation={slide.rotations?.rightLabel}
                                onRotationChange={(r) => updateRot('rightLabel', r)}
                            />
                        </div>
                    </div>
                );
            case 'content':
                return (
                    <div style={styles.max.contentLayer}>
                        <div style={styles.max.contentSlide}>
                            <EditableText
                                tagName="h2"
                                style={styles.max.contentTitle}
                                value={slide.title || ''}
                                onChange={(val) => handleEdit('title', val)}
                                fontSize={slide.fontSizes?.title}
                                onFontSizeChange={(s) => updateFS('title', s)}
                                draggable
                                position={slide.positions?.title}
                                onPositionChange={(p) => updatePos('title', p)}
                                rotation={slide.rotations?.title}
                                onRotationChange={(r) => updateRot('title', r)}
                            />
                            <EditableText
                                tagName="p"
                                style={styles.max.contentText}
                                value={slide.text || ''}
                                onChange={(val) => handleEdit('text', val)}
                                fontSize={slide.fontSizes?.text}
                                onFontSizeChange={(s) => updateFS('text', s)}
                                draggable
                                position={slide.positions?.text}
                                onPositionChange={(p) => updatePos('text', p)}
                                rotation={slide.rotations?.text}
                                onRotationChange={(r) => updateRot('text', r)}
                            />
                        </div>
                    </div>
                );
            case 'image':
                return (
                    <div style={styles.max.contentLayer}>
                        <div style={styles.max.imageSlide}>
                            {slide.image && (
                                <img
                                    src={slide.image}
                                    alt="Slide"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: slide.caption ? '80%' : '100%',
                                        objectFit: 'contain',
                                        borderRadius: 16,
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                        transform: 'rotate(-2deg)',
                                        border: '8px solid #fff'
                                    }}
                                />
                            )}
                            <EditableText
                                tagName="p"
                                style={styles.max.imageCaption}
                                value={slide.caption || ''}
                                onChange={(val) => handleEdit('caption', val)}
                                fontSize={slide.fontSizes?.caption}
                                onFontSizeChange={(s) => updateFS('caption', s)}
                                draggable
                                position={slide.positions?.caption}
                                onPositionChange={(p) => updatePos('caption', p)}
                                rotation={slide.rotations?.caption}
                                onRotationChange={(r) => updateRot('caption', r)}
                            />
                        </div>
                    </div>
                );
            case 'end':
                return (
                    <div style={styles.max.contentLayer}>
                        <div style={styles.max.endContent}>
                            <EditableText
                                tagName="h1"
                                style={styles.max.endTitle}
                                value={slide.title || ''}
                                onChange={(val) => handleEdit('title', val)}
                                fontSize={slide.fontSizes?.title}
                                onFontSizeChange={(s) => updateFS('title', s)}
                                draggable
                                position={slide.positions?.title}
                                onPositionChange={(p) => updatePos('title', p)}
                                rotation={slide.rotations?.title}
                                onRotationChange={(r) => updateRot('title', r)}
                            />
                            <button style={{ ...styles.max.ctaBtn, background: '#1a1a1a' }}>
                                <EditableText
                                    tagName="span"
                                    value={slide.cta || 'Contact Us'}
                                    onChange={(val) => handleEdit('cta', val)}
                                    fontSize={slide.fontSizes?.cta}
                                    onFontSizeChange={(s) => updateFS('cta', s)}
                                />
                            </button>
                        </div>
                    </div>
                );
            default:
                return (
                    <div style={styles.max.contentLayer}>
                        <div style={styles.max.titleContent}>
                            <EditableText
                                tagName="h1"
                                style={styles.max.titleMain}
                                value={slide.title || ''}
                                onChange={(val) => handleEdit('title', val)}
                                fontSize={slide.fontSizes?.title}
                                onFontSizeChange={(s) => updateFS('title', s)}
                                draggable
                                position={slide.positions?.title}
                                onPositionChange={(p) => updatePos('title', p)}
                                rotation={slide.rotations?.title}
                                onRotationChange={(r) => updateRot('title', r)}
                            />
                            <EditableText
                                tagName="p"
                                style={styles.max.titleSub}
                                value={slide.text || ''}
                                onChange={(val) => handleEdit('text', val)}
                                fontSize={slide.fontSizes?.text}
                                onFontSizeChange={(s) => updateFS('text', s)}
                                draggable
                                position={slide.positions?.text}
                                onPositionChange={(p) => updatePos('text', p)}
                                rotation={slide.rotations?.text}
                                onRotationChange={(r) => updateRot('text', r)}
                            />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div ref={containerRef} style={styles.max.slideContainer}>
            {/* Physics shapes layer */}
            {shapes.map((shape) => (
                <div
                    key={shape.id}
                    style={{
                        position: 'absolute',
                        left: shape.x,
                        top: shape.y,
                        width: shape.size,
                        height: shape.size,
                        borderRadius: shape.isCircle ? '50%' : shape.size * 0.2,
                        background: shape.color,
                        transform: `rotate(${shape.rotation}deg)`,
                        boxShadow: `0 6px 24px ${shape.color}30`,
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Content layer */}
            <div style={{ ...styles.max.contentLayer, pointerEvents: 'auto' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export const MaximalistTemplate: React.FC<TemplateProps & { onEdit?: (slideIndex: number, field: string, value: any) => void }> = ({ slides, logoUrl, isFullscreen, onEdit, onAdd, onAddImage, onDelete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Ensure currentSlide is valid if slides are deleted
    useEffect(() => {
        if (currentSlide >= slides.length && slides.length > 0) {
            setCurrentSlide(slides.length - 1);
        }
    }, [slides.length, currentSlide]);

    // Auto-navigate to new slide
    const prevSlidesLength = useRef(slides.length);
    useEffect(() => {
        if (slides.length > prevSlidesLength.current) {
            setCurrentSlide(slides.length - 1);
        }
        prevSlidesLength.current = slides.length;
    }, [slides.length]);

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
                                background: 'white',
                                color: '#1a1a1a',
                                border: '1px solid #e0e0e0',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 10,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s'
                            }}
                            title="Add Text Slide"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.borderColor = '#1a1a1a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = '#e0e0e0';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    )}
                    {!isFullscreen && onAddImage && (
                        <label
                            style={{
                                background: 'white',
                                color: '#1a1a1a',
                                border: '1px solid #e0e0e0',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 8,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s'
                            }}
                            title="Add Image Slide"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.borderColor = '#1a1a1a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = '#e0e0e0';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    if (e.target.files?.[0] && onAddImage) {
                                        onAddImage(currentSlide, e.target.files[0]);
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </label>
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
            background: '#ffffff',
            position: 'relative',
            fontFamily: baseFont,
            boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
            borderRadius: 16,
            overflow: 'hidden',
        },
        slideContainer: {
            width: '100%',
            height: 540,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 80,
            boxSizing: 'border-box',
            position: 'relative',
        },
        titleSlide: {
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 0,
        },
        titleMain: {
            fontSize: 64,
            fontWeight: 900,
            margin: 0,
            letterSpacing: '-0.05em',
            color: '#000000',
            lineHeight: 1.1,
            maxWidth: '90%',
            textAlign: 'center',
        },
        titleSub: {
            position: 'absolute',
            top: 0,
            right: 0,
            fontSize: 12,
            fontWeight: 700,
            color: '#002FA7', // Klein Blue
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
        },
        statementSlide: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        statementText: {
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.0,
            color: '#000000',
            margin: 0,
            letterSpacing: '-0.06em',
            textAlign: 'center',
        },
        twoColSlide: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
        twoColTitle: {
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 40,
            textAlign: 'left',
            color: '#000000',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            borderBottom: '2px solid #000',
            paddingBottom: 16,
            display: 'inline-block',
            width: 'auto',
        },
        twoColContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 60,
            flex: 1,
        },
        column: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
        },
        columnLabel: {
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#002FA7',
            display: 'block',
            marginBottom: 8,
        },
        columnItem: {
            fontSize: 20,
            margin: 0,
            color: '#000',
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: '-0.02em',
        },
        columnDivider: {
            width: 1,
            height: '100%',
            background: '#eee',
        },
        contentSlide: {
            width: '100%',
            height: '100%',
            padding: '60px 80px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 60,
        },
        contentTitle: {
            fontSize: 28,
            fontWeight: 800,
            color: '#000000',
            letterSpacing: '-0.03em',
            width: '30%',
            textAlign: 'left',
            lineHeight: 1.2,
        },
        contentText: {
            fontSize: 22,
            lineHeight: 1.5,
            color: '#333',
            whiteSpace: 'pre-wrap',
            width: '75%',
            textAlign: 'left',
        },
        quoteSlide: {
            textAlign: 'center',
            maxWidth: 800,
        },
        quoteText: {
            fontSize: 40,
            fontWeight: 900,
            fontStyle: 'normal',
            lineHeight: 1.3,
            color: '#000000',
            margin: 0,
            letterSpacing: '-0.04em',
        },
        quoteAuthor: {
            fontSize: 14,
            fontWeight: 700,
            marginTop: 40,
            color: '#002FA7',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
        },
        endSlide: {
            textAlign: 'center',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000', // Inverted for end slide
            color: '#fff',
        },
        endText: {
            fontSize: 72,
            fontWeight: 900,
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.06em',
            lineHeight: 1.0,
        },
        imageSlide: {
            width: '100%',
            height: '100%',
            position: 'relative',
            padding: 0, // Full bleed
        },
        imageCaption: {
            position: 'absolute',
            bottom: 40,
            left: 40,
            background: '#fff',
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 600,
            color: '#000',
            maxWidth: 400,
            textAlign: 'left',
        },
        nav: {
            position: 'absolute',
            bottom: 30,
            right: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 100,
        },
        navBtn: {
            background: '#fff',
            border: 'none',
            width: 40,
            height: 40,
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            color: '#000',
        },
        slideNum: {
            fontSize: 12,
            fontWeight: 700,
            color: '#002FA7',
            position: 'absolute',
            bottom: 30,
            left: 30,
        },
        label: {
            position: 'absolute',
            top: 20,
            left: 20,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#fff',
            background: '#000',
            padding: '6px 12px',
            textTransform: 'uppercase',
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
            background: '#F5F5F7', // Off-white background
            position: 'relative',
            fontFamily: baseFont,
            boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
            borderRadius: 16,
            overflow: 'hidden',
        },
        slideContainer: {
            width: '100%',
            height: 540,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            boxSizing: 'border-box',
            position: 'relative',
        },
        titleSlide: {
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'row', // Split screen
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 40,
        },
        titleContent: {
            position: 'relative',
            zIndex: 10,
            maxWidth: '55%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start', // Left aligned text
            textAlign: 'left',
        },
        titleMain: {
            fontSize: 56,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.03em',
            color: '#0A1929', // Navy
            lineHeight: 1.1,
            borderBottom: '6px solid #FF6B6B', // Highlight underline
            paddingBottom: 16,
            display: 'inline-block',
        },
        titleSub: {
            fontSize: 16,
            fontWeight: 600,
            marginTop: 24,
            color: '#555',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: '#fff',
            padding: '8px 16px',
            borderRadius: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
        statementSlide: {
            maxWidth: 800,
            textAlign: 'center',
            background: '#fff',
            padding: 60,
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
        },
        statementText: {
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#0A1929',
            margin: 0,
            letterSpacing: '-0.02em',
        },
        twoColSlide: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
        twoColTitle: {
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 30,
            textAlign: 'left',
            color: '#0A1929',
            letterSpacing: '-0.02em',
            background: '#fff',
            padding: '16px 32px',
            borderRadius: 16,
            alignSelf: 'flex-start',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        },
        twoColContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: 30,
            flex: 1,
        },
        column: {
            flex: 1,
            background: '#fff',
            borderRadius: 24,
            padding: 32,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
        },
        columnLabel: {
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            display: 'block',
            marginBottom: 20,
            paddingBottom: 8,
            borderBottom: '2px solid #FF6B6B', // Coral accent
            color: '#0A1929',
        },
        columnItem: {
            fontSize: 18,
            margin: '12px 0',
            color: '#333',
            fontWeight: 500,
            lineHeight: 1.5,
            paddingLeft: 16,
            borderLeft: '3px solid #eee',
        },
        columnDivider: {
            display: 'none', // No divider line, using cards
        },
        quoteSlide: {
            textAlign: 'center',
            maxWidth: 700,
            background: '#fff',
            padding: 60,
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
            borderLeft: '8px solid #FF6B6B',
        },
        quoteText: {
            fontSize: 32,
            fontWeight: 600,
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: '#0A1929',
            margin: 0,
            letterSpacing: '-0.01em',
        },
        quoteAuthor: {
            fontSize: 14,
            fontWeight: 700,
            marginTop: 32,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#FF6B6B',
        },
        endSlide: {
            textAlign: 'center',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        endText: {
            fontSize: 64,
            fontWeight: 800,
            color: '#0A1929',
            margin: 0,
            letterSpacing: '-0.03em',
            background: '#fff',
            padding: '40px 80px',
            borderRadius: 32,
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        },
        imageSlide: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            boxSizing: 'border-box',
        },
        imageCaption: {
            marginTop: -20, // Overlap image slightly
            zIndex: 10,
            fontSize: 18,
            textAlign: 'center',
            fontStyle: 'normal',
            fontWeight: 600,
            background: '#fff',
            padding: '12px 24px',
            borderRadius: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            color: '#0A1929',
        },
        nav: {
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#fff',
            padding: '8px 16px',
            borderRadius: 30,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
        navBtn: {
            background: 'none',
            border: 'none',
            width: 32,
            height: 32,
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            fontFamily: baseFont,
            transition: 'all 0.2s',
            color: '#0A1929',
            hover: { background: '#f0f0f0' }
        },
        slideNum: {
            fontSize: 12,
            fontWeight: 600,
            color: '#666',
        },
        label: {
            position: 'absolute',
            top: 20,
            left: 20,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#fff',
            background: '#0A1929',
            padding: '6px 12px',
            borderRadius: 4,
            textTransform: 'uppercase',
        },
    },

    // Maximalist Styles
    max: {
        container: {
            width: 960,
            height: 540,
            background: '#CCFF00', // Acid Green
            position: 'relative',
            fontFamily: '"Oswald", "Impact", sans-serif', // Condensed font
            boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
            borderRadius: 16,
            overflow: 'hidden',
            border: '4px solid #000',
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
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'repeating-linear-gradient(45deg, #CCFF00, #CCFF00 10px, #C2F200 10px, #C2F200 20px)',
        },
        titleMain: {
            fontSize: 96,
            fontWeight: 900,
            color: '#000',
            margin: 0,
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            textTransform: 'uppercase',
            transform: 'rotate(-2deg)',
            mixBlendMode: 'multiply',
        },
        titleSub: {
            fontSize: 24,
            color: '#fff',
            marginTop: 24,
            fontWeight: 700,
            letterSpacing: '0.1em',
            background: '#000',
            padding: '8px 24px',
            transform: 'rotate(1deg)',
            textTransform: 'uppercase',
        },
        bigNumContent: {
            textAlign: 'center',
            pointerEvents: 'auto',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#000',
            color: '#CCFF00',
        },
        bigNum: {
            fontSize: 220,
            fontWeight: 900,
            display: 'block',
            letterSpacing: '-0.08em',
            lineHeight: 1.0,
            color: 'transparent',
            WebkitTextStroke: '4px #CCFF00', // Outline text
        },
        bigNumLabel: {
            fontSize: 48,
            color: '#CCFF00',
            margin: '-40px 0 0',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            background: '#000',
            padding: '0 20px',
            zIndex: 10,
        },
        bigNumDetail: {
            fontSize: 20,
            color: '#fff',
            marginTop: 20,
            fontWeight: 600,
            fontFamily: baseFont,
        },
        gridContent: {
            textAlign: 'center',
            pointerEvents: 'auto',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: '20px 20px',
        },
        gridTitle: {
            fontSize: 56,
            color: '#000',
            marginBottom: 40,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            background: '#CCFF00',
            padding: '0 16px',
            border: '3px solid #000',
            boxShadow: '4px 4px 0 #000',
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
            maxWidth: 600,
        },
        gridItem: {
            background: '#fff',
            border: '3px solid #000',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            boxShadow: '8px 8px 0 #000',
            transition: 'transform 0.2s',
        },
        gridIcon: {
            fontSize: 32,
        },
        gridLabel: {
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
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
            color: '#000',
            padding: 40,
            borderRight: '4px solid #000',
        },
        splitTitle: {
            fontSize: 16,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 16,
            background: '#000',
            color: '#CCFF00',
            padding: '4px 12px',
        },
        splitValue: {
            fontSize: 100,
            fontWeight: 900,
            letterSpacing: '-0.06em',
            lineHeight: 1.0,
        },
        splitLabel: {
            fontSize: 24,
            marginTop: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
        },
        splitDivider: {
            width: 0,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
        },
        splitArrowCircle: {
            width: 60,
            height: 60,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            border: '4px solid #000',
            fontSize: 24,
            background: '#fff',
            boxShadow: '4px 4px 0 #000',
        },
        contentSlide: {
            width: '100%',
            height: '100%',
            padding: '60px 80px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 2,
            position: 'relative',
            backgroundImage: 'linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)',
            backgroundSize: '100px 100px',
            backgroundPosition: '-2px -2px',
        },
        contentTitle: {
            fontSize: 56,
            fontWeight: 900,
            marginBottom: 40,
            color: '#000',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            width: 'auto',
            background: '#CCFF00',
            padding: '8px 24px',
            border: '4px solid #000',
            boxShadow: '8px 8px 0 #000',
            transform: 'rotate(-1deg)',
        },
        contentText: {
            fontSize: 32,
            lineHeight: 1.4,
            fontWeight: 700,
            color: '#000',
            whiteSpace: 'pre-wrap',
            maxWidth: '85%',
            letterSpacing: '-0.02em',
            textAlign: 'center',
            background: '#fff',
            padding: '24px',
            border: '3px solid #000',
            boxShadow: '8px 8px 0 #000',
        },
        endContent: {
            textAlign: 'center',
            pointerEvents: 'auto',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
        },
        endTitle: {
            fontSize: 140,
            fontWeight: 900,
            color: '#CCFF00',
            marginBottom: 0,
            letterSpacing: '-0.08em',
            lineHeight: 0.8,
            textTransform: 'uppercase',
        },
        imageSlide: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            boxSizing: 'border-box',
            zIndex: 2,
            position: 'relative',
        },
        imageCaption: {
            marginTop: -40,
            fontSize: 32,
            color: '#fff',
            textAlign: 'center',
            fontWeight: 900,
            background: '#000',
            padding: '16px 32px',
            transform: 'rotate(2deg)',
            textTransform: 'uppercase',
            border: '2px solid #CCFF00',
        },
        nav: {
            position: 'absolute',
            bottom: 20,
            left: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            border: '3px solid #000',
            background: '#fff',
            boxShadow: '4px 4px 0 #000',
        },
        navBtn: {
            background: '#fff',
            border: 'none',
            borderRight: '2px solid #000',
            width: 40,
            height: 40,
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: baseFont,
            color: '#000',
            borderRadius: 0,
        },
        slideNum: {
            fontSize: 16,
            fontWeight: 900,
            color: '#000',
            padding: '0 16px',
        },
        label: {
            position: 'absolute',
            top: 0,
            left: 0,
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: '#000',
            background: '#CCFF00',
            padding: '8px 16px',
            borderRight: '3px solid #000',
            borderBottom: '3px solid #000',
            textTransform: 'uppercase',
        },
    },
};
