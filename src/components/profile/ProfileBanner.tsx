'use client';

import React, { useEffect, useRef } from 'react';

export const ProfileBanner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Grid configuration for the slats
    const slatWidth = 10;
    const slatGap = 6;
    const slatRadius = 5;

    // Pseudo-random seed for stable pattern
    let time = 0;

    const render = () => {
      time += 0.015;
      const isLight = document.documentElement.classList.contains('light');

      ctx.clearRect(0, 0, width, height);

      // Base background gradient
      if (isLight) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, width, height);
      }

      const totalSlatWidth = slatWidth + slatGap;
      const cols = Math.ceil(width / totalSlatWidth) + 1;
      const rows = 12;
      const rowHeight = (height - 20) / rows;

      for (let col = 0; col < cols; col++) {
        const x = col * totalSlatWidth;

        // Wave factor across columns
        const wave = Math.sin(col * 0.15 + time) * 0.4 + 0.6;
        const wave2 = Math.cos(col * 0.08 - time * 0.7) * 0.3 + 0.5;

        for (let row = 0; row < rows; row++) {
          const y = 10 + row * rowHeight;
          const h = rowHeight - 4;

          // Compute density and brightness based on position and waves
          const centerDist = Math.abs(col - cols / 2) / (cols / 2);
          const rowNorm = row / rows;
          
          // Organic variation
          const noise = Math.sin(col * 2.3 + row * 1.7 + time * 0.5) * 0.5 + 0.5;
          const activity = (wave * 0.5 + wave2 * 0.3 + noise * 0.2) * (1 - centerDist * 0.3);

          if (isLight) {
            // Light mode: soft emerald and mint pastel slats
            const alpha = Math.max(0.12, Math.min(0.85, activity * (0.4 + (1 - rowNorm) * 0.6)));
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
          } else {
            // Dark mode: glowing emerald slats
            const isHighlight = noise > 0.82 && col < cols * 0.25;
            if (isHighlight) {
              ctx.fillStyle = `rgba(110, 231, 183, ${(0.8 + wave * 0.2).toFixed(2)})`;
            } else {
              const alpha = Math.max(0.08, Math.min(0.75, activity * (0.3 + rowNorm * 0.6)));
              ctx.fillStyle = `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
            }
          }

          // Draw rounded slat
          ctx.beginPath();
          ctx.roundRect(x, y, slatWidth, h, slatRadius);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative overflow-hidden h-36 sm:h-52 w-full border-b border-line bg-surface select-none">
      {/* Background animated blobs */}
      <div className="cover absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-1)',
            top: '-45%',
            left: '-12%',
            ['--dur' as string]: '24s',
            ['--delay' as string]: '0s',
          }}
        />
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-2)',
            top: '15%',
            left: '8%',
            ['--dur' as string]: '27s',
            ['--delay' as string]: '-4s',
          }}
        />
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-3)',
            top: '-35%',
            left: '32%',
            ['--dur' as string]: '29s',
            ['--delay' as string]: '-8s',
          }}
        />
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-4)',
            top: '5%',
            left: '55%',
            ['--dur' as string]: '23s',
            ['--delay' as string]: '-12s',
          }}
        />
      </div>

      {/* Slat Canvas Grid */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-hidden="true"
      />
    </div>
  );
};
