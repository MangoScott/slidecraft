'use client';

import { useEffect, useRef, useState } from 'react';

interface Card {
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    type: 'slide' | 'content' | 'style' | 'ai';
    label: string;
    icon: string;
    dragging: boolean;
    floatPhase: number;
    floatSpeed: number;
    el?: HTMLDivElement;
}

export default function PhysicsHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [antigravityMode, setAntigravityMode] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const cardsRef = useRef<Card[]>([]);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Card data representing presentation elements
        const cardData = [
            { label: "Title Slide", icon: "📑", type: "slide", w: 120, h: 90 },
            { label: "Charts", icon: "📊", type: "content", w: 100, h: 80 },
            { label: "Images", icon: "🖼️", type: "content", w: 110, h: 85 },
            { label: "AI Magic", icon: "✨", type: "ai", w: 100, h: 100 }, // Square for AI
            { label: "Theme", icon: "🎨", type: "style", w: 90, h: 70 },
            { label: "Layout", icon: "📐", type: "style", w: 110, h: 80 },
            { label: "Bullet Points", icon: "📝", type: "content", w: 130, h: 95 },
            { label: "Conclusion", icon: "🏁", type: "slide", w: 115, h: 85 },
            { label: "Export PDF", icon: "📄", type: "ai", w: 105, h: 80 },
        ] as const;

        const gravity = 0.3;
        const friction = 0.99;
        const bounce = 0.6;

        // Initialize cards
        const initCards = () => {
            container.innerHTML = '';
            cardsRef.current = [];

            const width = container.offsetWidth;
            const height = container.offsetHeight;
            const isMobile = width < 768;
            const centerX = isMobile ? width / 2 : width * 0.65;
            const centerY = height / 2;

            cardData.forEach((data, i) => {
                // Scale down for mobile
                const scale = isMobile ? 0.7 : 1;
                const w = data.w * scale;
                const h = data.h * scale;

                const angle = (i / cardData.length) * Math.PI * 2;
                const dist = isMobile ? 80 + (i * 15) : 120 + (i * 20);
                const x = centerX + Math.cos(angle) * dist - w / 2;
                const y = centerY + Math.sin(angle) * dist * 0.7 - h / 2;

                const el = document.createElement('div');
                el.className = `card ${data.type}`;
                el.style.width = `${w}px`;
                el.style.height = `${h}px`;
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;

                // Inner content
                el.innerHTML = `
          <div class="card-icon">${data.icon}</div>
          <div class="card-label">${data.label}</div>
        `;

                container.appendChild(el);

                const card: Card = {
                    x, y,
                    vx: 0, vy: 0,
                    width: w,
                    height: h,
                    type: data.type,
                    label: data.label,
                    icon: data.icon,
                    dragging: false,
                    floatPhase: Math.random() * Math.PI * 2,
                    floatSpeed: 0.02 + Math.random() * 0.02,
                    el
                };

                cardsRef.current.push(card);
                setupDrag(card);
            });
        };

        const setupDrag = (card: Card) => {
            let startX = 0;
            let startY = 0;
            let offsetX = 0;
            let offsetY = 0;

            const onStart = (e: MouseEvent | TouchEvent) => {
                e.preventDefault();
                card.dragging = true;
                card.vx = 0;
                card.vy = 0;
                setHasInteracted(true);

                const touch = 'touches' in e ? e.touches[0] : e;
                const rect = container.getBoundingClientRect();
                startX = touch.clientX;
                startY = touch.clientY;
                offsetX = touch.clientX - rect.left - card.x;
                offsetY = touch.clientY - rect.top - card.y;

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onEnd);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd);
            };

            const onMove = (e: MouseEvent | TouchEvent) => {
                if (!card.dragging) return;
                e.preventDefault();

                const touch = 'touches' in e ? e.touches[0] : e;
                const rect = container.getBoundingClientRect();
                const newX = touch.clientX - rect.left - offsetX;
                const newY = touch.clientY - rect.top - offsetY;

                card.vx = newX - card.x;
                card.vy = newY - card.y;
                card.x = newX;
                card.y = newY;
            };

            const onEnd = () => {
                card.dragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
            };

            if (card.el) {
                card.el.addEventListener('mousedown', onStart);
                card.el.addEventListener('touchstart', onStart, { passive: false });
            }
        };

        initCards();

        const handleResize = () => {
            initCards();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        const update = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.offsetWidth;
            const height = containerRef.current.offsetHeight;
            const gravity = 0.3;
            const friction = 0.99;
            const bounce = 0.6;

            cardsRef.current.forEach((card, i) => {
                if (card.dragging) {
                    if (card.el) {
                        card.el.style.left = `${card.x}px`;
                        card.el.style.top = `${card.y}px`;
                        card.el.style.transform = `scale(1.05) rotate(0deg)`;
                        card.el.style.zIndex = '100';
                    }
                    return;
                }

                if (antigravityMode) {
                    card.floatPhase += card.floatSpeed;
                    const floatForceX = Math.sin(card.floatPhase) * 0.05;
                    const floatForceY = Math.cos(card.floatPhase * 0.7) * 0.05;
                    card.vy -= 0.02;
                    card.vx += floatForceX;
                    card.vy += floatForceY;
                    card.vx *= 0.995;
                    card.vy *= 0.995;
                } else {
                    card.vy += gravity;
                    card.vx *= friction;
                    card.vy *= friction;
                }

                card.x += card.vx;
                card.y += card.vy;

                // Boundary collisions
                if (card.x < 0) {
                    card.x = 0;
                    card.vx *= -bounce;
                }
                if (card.x + card.width > width) {
                    card.x = width - card.width;
                    card.vx *= -bounce;
                }
                if (card.y < 0) {
                    card.y = 0;
                    card.vy *= -bounce;
                }
                if (card.y + card.height > height) {
                    card.y = height - card.height;
                    card.vy *= -bounce;
                }

                // Card-to-card collisions (Approximated as circles for simplicity/performance)
                // Using average dimension as diameter
                for (let j = i + 1; j < cardsRef.current.length; j++) {
                    const other = cardsRef.current[j];

                    const cardRadius = (card.width + card.height) / 4;
                    const otherRadius = (other.width + other.height) / 4;

                    const dx = (other.x + other.width / 2) - (card.x + card.width / 2);
                    const dy = (other.y + other.height / 2) - (card.y + card.height / 2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const minDist = cardRadius + otherRadius;

                    if (dist < minDist && dist > 0) {
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;

                        card.x -= nx * overlap / 2;
                        card.y -= ny * overlap / 2;
                        other.x += nx * overlap / 2;
                        other.y += ny * overlap / 2;

                        const dvx = card.vx - other.vx;
                        const dvy = card.vy - other.vy;
                        const dot = dvx * nx + dvy * ny;

                        card.vx -= dot * nx * bounce;
                        card.vy -= dot * ny * bounce;
                        other.vx += dot * nx * bounce;
                        other.vy += dot * ny * bounce;
                    }
                }

                if (card.el) {
                    card.el.style.left = `${card.x}px`;
                    card.el.style.top = `${card.y}px`;
                    // Add slight rotation based on velocity for fun
                    const rotation = card.vx * 2;
                    card.el.style.transform = `rotate(${rotation}deg)`;
                    card.el.style.zIndex = '1';
                }
            });

            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [antigravityMode]);

    const toggleAntigravity = () => {
        setAntigravityMode(!antigravityMode);
        setHasInteracted(true);

        if (!antigravityMode) {
            cardsRef.current.forEach(card => {
                card.vy -= 2 + Math.random() * 2;
                card.vx += (Math.random() - 0.5) * 2;
            });
        }
    };

    return (
        <>
            <div
                ref={containerRef}
                className="physics-area"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1,
                    overflow: 'hidden'
                }}
            />

            <div className={`physics-hint ${hasInteracted ? 'hidden' : ''}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 4l-4 4 4 4" />
                    <path d="M10 20l4-4-4-4" />
                </svg>
                Toss the cards · Watch them float
            </div>

            <div className={`physics-controls ${hasInteracted ? 'visible' : ''}`}>
                <button
                    className={`physics-btn ${antigravityMode ? 'antigravity-active' : ''}`}
                    onClick={toggleAntigravity}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span>{antigravityMode ? 'Gravity' : 'Antigravity'}</span>
                </button>
            </div>

            <style jsx global>{`
        .card {
          position: absolute;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: grab;
          user-select: none;
          transition: box-shadow 0.2s, transform 0.1s;
          pointer-events: auto;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
          padding: 8px;
          text-align: center;
        }
        
        .card:active { cursor: grabbing; }
        .card:hover { box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
        
        .card-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        
        .card-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-color);
          line-height: 1.2;
        }
        
        .card.slide {
          background: linear-gradient(135deg, #ffffff, #f0f0f0);
          border-left: 4px solid var(--accent-color);
        }
        
        .card.content {
          background: linear-gradient(135deg, #ffffff, #f8fafc);
          border-left: 4px solid var(--mood-color);
        }
        
        .card.style {
          background: linear-gradient(135deg, #ffffff, #fff7ed);
          border-left: 4px solid var(--energy-color);
        }
        
        .card.ai {
          background: linear-gradient(135deg, #ffffff, #f5f3ff);
          border-left: 4px solid var(--sleep-color);
        }

        .physics-hint {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          font-size: 0.85rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 1;
          transition: opacity 0.5s;
          pointer-events: none;
        }
        .physics-hint.hidden { opacity: 0; }
        .physics-hint svg { animation: wiggle 2s ease-in-out infinite; }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }

        .physics-controls {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
          display: flex;
          gap: 12px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s;
          pointer-events: none;
        }
        .physics-controls.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .physics-btn {
          background: var(--text-color);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 100px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .physics-btn:hover {
          background: #333;
          transform: translateY(-2px);
        }
        .physics-btn.antigravity-active {
          background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
        }
        .physics-btn svg { width: 16px; height: 16px; }
      `}</style>
        </>
    );
}
