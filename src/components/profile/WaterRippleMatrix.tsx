'use client';

import React, { useEffect, useRef } from 'react';

interface WaterRippleMatrixProps {
  className?: string;
  slatWidth?: number;
  slatHeight?: number;
  gap?: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  speed: number;
}

export const WaterRippleMatrix: React.FC<WaterRippleMatrixProps> = ({
  className = 'h-36 sm:h-52',
  slatWidth = 8,
  slatHeight = 20,
  gap = 3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    const ripples: Ripple[] = [];
    let mouse = { x: -1000, y: -1000, active: false };
    let lastMousePos = { x: -1000, y: -1000 };
    let time = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const addRipple = (x: number, y: number, strength = 1.0) => {
      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.75,
        strength,
        speed: 4.5,
      });
      // Keep active ripple array manageable
      if (ripples.length > 12) {
        ripples.shift();
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      mouse = { x, y, active: true };

      // Trigger ripple if cursor moved enough distance
      const dist = Math.hypot(x - lastMousePos.x, y - lastMousePos.y);
      if (dist > 18) {
        addRipple(x, y, Math.min(dist / 25, 1.2));
        lastMousePos = { x, y };
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      addRipple(x, y, 1.6);
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    canvas.addEventListener('mouseleave', handlePointerLeave);

    // Initial ambient swell trigger
    setTimeout(() => {
      addRipple(width * 0.25, height * 0.5, 1.2);
    }, 300);

    const cornerRadius = 4;
    const stepX = slatWidth + gap;
    const stepY = slatHeight + gap;

    const render = () => {
      time += 0.02;
      const isLight = document.documentElement.classList.contains('light');

      ctx.clearRect(0, 0, width, height);

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.strength *= 0.982;
        if (r.radius > r.maxRadius || r.strength < 0.02) {
          ripples.splice(i, 1);
        }
      }

      const cols = Math.ceil(width / stepX) + 1;
      const rows = Math.ceil(height / stepY) + 1;

      // Draw each slat with water ripple displacement & swell
      for (let col = 0; col < cols; col++) {
        const baseX = col * stepX;

        for (let row = 0; row < rows; row++) {
          const baseY = row * stepY;

          // 1. Ambient diagonal swell wave (matching exact nahian.bd look)
          const diagPos = (col / cols) * 0.65 + (1 - row / rows) * 0.35;
          const ambientWave = Math.sin(diagPos * Math.PI * 2 - time) * 0.35 + 0.65;
          const organicNoise = Math.sin(col * 0.22 + row * 0.15 + time * 0.5) * 0.2;
          let intensity = Math.max(0.08, Math.min(1, ambientWave + organicNoise));

          // 2. Ripple displacement calculation
          let rippleDisplacement = 0;
          for (let i = 0; i < ripples.length; i++) {
            const rip = ripples[i];
            const dist = Math.hypot(baseX - rip.x, baseY - rip.y);
            const waveFront = Math.abs(dist - rip.radius);
            if (waveFront < 45) {
              const factor = (1 - waveFront / 45) * rip.strength;
              rippleDisplacement += Math.sin((waveFront / 45) * Math.PI) * factor;
            }
          }

          // 3. Mouse proximity glint
          if (mouse.active) {
            const mDist = Math.hypot(baseX - mouse.x, baseY - mouse.y);
            if (mDist < 70) {
              const mFactor = (1 - mDist / 70) * 0.85;
              rippleDisplacement += mFactor;
            }
          }

          intensity = Math.min(1.4, intensity + rippleDisplacement * 0.85);

          // Render Slat
          const scale = 1 + Math.max(-0.2, Math.min(0.35, rippleDisplacement * 0.3));
          const w = slatWidth * scale;
          const h = slatHeight * scale;
          const cx = baseX + slatWidth / 2;
          const cy = baseY + slatHeight / 2;

          ctx.beginPath();
          ctx.roundRect(cx - w / 2, cy - h / 2, w, h, cornerRadius);

          if (isLight) {
            // Light Theme Palette: Vibrant emerald & mint tones matching nahian.bd
            const baseAlpha = Math.max(0.35, Math.min(0.95, intensity * 0.88));
            
            if (rippleDisplacement > 0.12) {
              // Highlighted water wave crest
              ctx.fillStyle = `rgba(5, 150, 105, ${Math.min(1, baseAlpha + 0.25).toFixed(2)})`;
            } else if (intensity > 0.72) {
              // Rich emerald slat
              ctx.fillStyle = `rgba(16, 185, 129, ${baseAlpha.toFixed(2)})`;
            } else if (intensity > 0.48) {
              // Mint green slat
              ctx.fillStyle = `rgba(52, 211, 153, ${baseAlpha.toFixed(2)})`;
            } else {
              // Soft pastel mint slat
              ctx.fillStyle = `rgba(110, 231, 183, ${Math.max(0.38, baseAlpha).toFixed(2)})`;
            }
          } else {
            // Dark Theme Palette: Glowing matrix green against dark surface
            const baseAlpha = Math.max(0.25, Math.min(0.95, intensity * 0.85));
            if (rippleDisplacement > 0.12) {
              ctx.fillStyle = `rgba(110, 231, 183, ${Math.min(1, baseAlpha + 0.35).toFixed(2)})`;
            } else if (intensity > 0.72) {
              ctx.fillStyle = `rgba(52, 211, 153, ${baseAlpha.toFixed(2)})`;
            } else if (intensity > 0.48) {
              ctx.fillStyle = `rgba(16, 185, 129, ${baseAlpha.toFixed(2)})`;
            } else {
              ctx.fillStyle = `rgba(6, 78, 59, ${Math.max(0.35, baseAlpha).toFixed(2)})`;
            }
          }

          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [slatWidth, slatHeight, gap]);

  return (
    <div className={`relative w-full overflow-hidden select-none cursor-pointer ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label="Interactive Water Ripple Matrix"
      />
    </div>
  );
};

