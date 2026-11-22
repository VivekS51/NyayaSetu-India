'use client';

import React, { useRef, useEffect } from 'react';
import './styles.css';

export type ConstellationVariant =
  | 'constellation-field'
  | 'particle-drift'
  | 'particle-network'
  | 'gateway-flow'
  | 'connectivity-graph'
  | 'interface-lines'
  | 'defense-lines'
  | 'topo-field';

export interface ConstellationFieldProps {
  variant?: ConstellationVariant;
  mode?: 'dark' | 'light';
  speed?: number;
  size?: number;
  strokeWidth?: number;
  length?: number;
  density?: number;
  opacity?: number;
  palette?: 'saffron' | 'emerald' | 'blue' | 'tricolor' | 'gold' | string;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  color: string;
  phase: number;
  hub?: boolean;
  orbitRadius?: number;
  angle?: number;
  orbitSpeed?: number;
}

export const ConstellationField: React.FC<ConstellationFieldProps> = ({
  variant = 'constellation-field',
  mode = 'dark',
  speed = 1,
  size = 1,
  strokeWidth = 1,
  length = 1,
  density = 1,
  opacity = 1,
  palette = 'tricolor',
  interactive = true,
  className = '',
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;

    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
      radius: 160 * size,
    };

    // Color resolution
    const isDark = mode === 'dark';
    const primaryAlpha = opacity;

    const getColors = () => {
      if (palette === 'saffron') {
        return ['#ff9933', '#f59e0b', '#fbbf24', '#ffedd5'];
      }
      if (palette === 'emerald') {
        return ['#10b981', '#059669', '#34d399', '#a7f3d0'];
      }
      if (palette === 'blue') {
        return ['#38bdf8', '#0284c7', '#60a5fa', '#93c5fd'];
      }
      if (palette === 'tricolor') {
        return isDark
          ? ['#ff9933', '#ffffff', '#138808', '#38bdf8']
          : ['#d97706', '#0f172a', '#059669', '#0284c7'];
      }
      return isDark
        ? ['#38bdf8', '#ff9933', '#ffffff', '#818cf8']
        : ['#0284c7', '#d97706', '#1e293b', '#4f46e5'];
    };

    const colors = getColors();

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();

    // Particle creation based on variant
    const baseCount = Math.floor((width * height) / (12000 / density));
    const count = Math.max(25, Math.min(baseCount, 160));

    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const pColor = colors[i % colors.length];
      const isHub = i % 12 === 0;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8 * speed,
        vy: (Math.random() - 0.5) * 0.8 * speed,
        radius: (isHub ? 3.5 : Math.random() * 2 + 1) * size,
        baseRadius: (isHub ? 3.5 : Math.random() * 2 + 1) * size,
        alpha: Math.random() * 0.6 + 0.3,
        color: pColor,
        phase: Math.random() * Math.PI * 2,
        hub: isHub,
        orbitRadius: Math.random() * 80 + 30,
        angle: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() - 0.5) * 0.02 * speed,
      });
    }

    // Topographic Elevation Grid (for topo-field)
    const topoLines = 18;

    // Mouse handlers
    const onMouseMove = (e: MouseEvent) => {
      if (!interactive || !container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const onMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!interactive || !container || e.touches.length === 0) return;
      const rect = container.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
      mouse.active = true;
    };

    if (interactive && container) {
      container.addEventListener('mousemove', onMouseMove, { passive: true });
      container.addEventListener('mouseleave', onMouseLeave, { passive: true });
      container.addEventListener('touchmove', onTouchMove, { passive: true });
      container.addEventListener('touchend', onMouseLeave, { passive: true });
    }

    // Visibility Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
      });
    });
    observer.observe(container);

    let resizeTimer: any;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
      }, 100);
    };
    window.addEventListener('resize', onResize);

    let time = 0;

    // =========================================================================
    // RENDER PASSES
    // =========================================================================
    const render = () => {
      if (!isVisible) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      time += 0.016 * speed;
      ctx.clearRect(0, 0, width, height);

      // -----------------------------------------------------------------------
      // Variant 1: Constellation Field (Default)
      // -----------------------------------------------------------------------
      if (variant === 'constellation-field' || variant === 'particle-network') {
        const maxDist = 130 * length;

        // Draw connecting edges
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
              const alphaRatio = 1 - dist / maxDist;
              const edgeAlpha = alphaRatio * 0.45 * primaryAlpha;

              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = isDark
                ? `rgba(255, 153, 51, ${edgeAlpha})`
                : `rgba(15, 23, 42, ${edgeAlpha * 0.7})`;
              ctx.lineWidth = (p1.hub || p2.hub ? 1.5 : 0.8) * strokeWidth;
              ctx.stroke();

              // Network pulse travelling on lines (particle-network)
              if (variant === 'particle-network' && dist > 50 && (i + j) % 7 === 0) {
                const pulsePos = (Math.sin(time * 2 + i) + 1) / 2;
                const px = p1.x + (p2.x - p1.x) * pulsePos;
                const py = p1.y + (p2.y - p1.y) * pulsePos;
                ctx.beginPath();
                ctx.arc(px, py, 1.6 * size, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? '#ffffff' : '#0284c7';
                ctx.fill();
              }
            }
          }

          // Mouse proximity connection web
          if (mouse.active) {
            const mdx = p1.x - mouse.x;
            const mdy = p1.y - mouse.y;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mDist < mouse.radius) {
              const mAlpha = (1 - mDist / mouse.radius) * 0.65 * primaryAlpha;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = isDark
                ? `rgba(56, 189, 248, ${mAlpha})`
                : `rgba(2, 132, 199, ${mAlpha})`;
              ctx.lineWidth = 1.2 * strokeWidth;
              ctx.stroke();

              // Slight gravitational attraction towards cursor
              p1.x -= (mdx / mDist) * 0.5 * speed;
              p1.y -= (mdy / mDist) * 0.5 * speed;
            }
          }
        }

        // Draw particle vertices
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          else if (p.y > height + 10) p.y = -10;

          // Pulsing glow
          const pulse = Math.sin(time * 2 + p.phase) * 0.4 + 1;
          const currentRadius = p.radius * pulse;

          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * primaryAlpha;
          ctx.fill();

          if (p.hub) {
            // Ring around hub vertices
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentRadius + 3.5, 0, Math.PI * 2);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 0.35 * primaryAlpha;
            ctx.stroke();
          }

          ctx.globalAlpha = 1;
        }
      }

      // -----------------------------------------------------------------------
      // Variant 2: Topo Field (Mathematical Elevation Waves)
      // -----------------------------------------------------------------------
      else if (variant === 'topo-field') {
        const stepY = height / (topoLines + 1);
        for (let i = 1; i <= topoLines; i++) {
          const baseY = i * stepY;
          ctx.beginPath();
          for (let x = 0; x <= width; x += 8) {
            const harmonic1 = Math.sin(x * 0.006 + time + i * 0.3) * 22;
            const harmonic2 = Math.cos(x * 0.012 - time * 0.8 + i) * 12;
            const mouseEffect =
              mouse.active && Math.abs(x - mouse.x) < 180
                ? Math.sin(((x - mouse.x) / 180) * Math.PI) * 35 * (1 - Math.abs(baseY - mouse.y) / height)
                : 0;

            const y = baseY + harmonic1 + harmonic2 + mouseEffect;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          const lineAlpha = (0.2 + (i / topoLines) * 0.45) * primaryAlpha;
          ctx.strokeStyle = isDark
            ? i % 3 === 0
              ? `rgba(255, 153, 51, ${lineAlpha})`
              : `rgba(56, 189, 248, ${lineAlpha * 0.7})`
            : `rgba(15, 23, 42, ${lineAlpha * 0.5})`;
          ctx.lineWidth = (i % 4 === 0 ? 1.6 : 0.9) * strokeWidth;
          ctx.stroke();
        }
      }

      // -----------------------------------------------------------------------
      // Variant 3: Gateway Flow (Perspective Warp & Radiant Beams)
      // -----------------------------------------------------------------------
      else if (variant === 'gateway-flow') {
        const cx = mouse.active ? mouse.x : width / 2;
        const cy = mouse.active ? mouse.y : height / 2;
        const rings = 14;

        for (let r = 1; r <= rings; r++) {
          const radius = ((r * 32 + time * 45) % (Math.max(width, height) * 0.8)) * length;
          const alpha = (1 - radius / (Math.max(width, height) * 0.8)) * 0.5 * primaryAlpha;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = r % 2 === 0
            ? `rgba(255, 153, 51, ${alpha})`
            : `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = (r % 3 === 0 ? 1.8 : 0.9) * strokeWidth;
          ctx.stroke();
        }

        // Radiating particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          p.x += Math.cos(angle) * (2.2 * speed);
          p.y += Math.sin(angle) * (2.2 * speed);

          if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || dist < 20) {
            p.x = cx + (Math.random() - 0.5) * 60;
            p.y = cy + (Math.random() - 0.5) * 60;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * primaryAlpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // -----------------------------------------------------------------------
      // Variant 4: Connectivity Graph (Hub Clusters & Orbits)
      // -----------------------------------------------------------------------
      else if (variant === 'connectivity-graph') {
        const hubs = particles.filter((p) => p.hub);

        // Draw links between hubs
        for (let i = 0; i < hubs.length; i++) {
          for (let j = i + 1; j < hubs.length; j++) {
            ctx.beginPath();
            ctx.moveTo(hubs[i].x, hubs[i].y);
            ctx.lineTo(hubs[j].x, hubs[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(255, 153, 51, ${0.25 * primaryAlpha})`
              : `rgba(15, 23, 42, ${0.15 * primaryAlpha})`;
            ctx.lineWidth = 1.2 * strokeWidth;
            ctx.setLineDash([4, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Draw orbiting satellites around hubs
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const parentHub = hubs[i % hubs.length];

          if (p.angle !== undefined && p.orbitSpeed !== undefined && p.orbitRadius !== undefined) {
            p.angle += p.orbitSpeed;
            p.x = parentHub.x + Math.cos(p.angle) * p.orbitRadius;
            p.y = parentHub.y + Math.sin(p.angle) * p.orbitRadius;

            ctx.beginPath();
            ctx.moveTo(parentHub.x, parentHub.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.18 * primaryAlpha})`;
            ctx.lineWidth = 0.6 * strokeWidth;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * primaryAlpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // -----------------------------------------------------------------------
      // Variant 5: Interface / Defense Lines (HUD Radar & Vectors)
      // -----------------------------------------------------------------------
      else if (variant === 'interface-lines' || variant === 'defense-lines') {
        const gridSize = 65;
        ctx.strokeStyle = isDark ? `rgba(56, 189, 248, ${0.08 * primaryAlpha})` : `rgba(15, 23, 42, ${0.05 * primaryAlpha})`;
        ctx.lineWidth = 0.5 * strokeWidth;

        // Vector grid
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Sweeping radar beam
        const radarY = (time * 80) % height;
        const grad = ctx.createLinearGradient(0, radarY - 60, 0, radarY);
        grad.addColorStop(0, 'rgba(255, 153, 51, 0)');
        grad.addColorStop(1, isDark ? `rgba(255, 153, 51, ${0.28 * primaryAlpha})` : `rgba(217, 119, 6, ${0.18 * primaryAlpha})`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, radarY - 60, width, 60);

        ctx.beginPath();
        ctx.moveTo(0, radarY);
        ctx.lineTo(width, radarY);
        ctx.strokeStyle = isDark ? `rgba(255, 153, 51, ${0.8 * primaryAlpha})` : `rgba(217, 119, 6, ${0.6 * primaryAlpha})`;
        ctx.lineWidth = 1.2 * strokeWidth;
        ctx.stroke();

        // Polygon defense traces
        if (variant === 'defense-lines') {
          for (let i = 0; i < particles.length; i += 3) {
            if (i + 2 < particles.length) {
              const p1 = particles[i];
              const p2 = particles[i + 1];
              const p3 = particles[i + 2];

              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.lineTo(p3.x, p3.y);
              ctx.closePath();
              ctx.strokeStyle = `rgba(19, 136, 8, ${0.22 * primaryAlpha})`;
              ctx.fillStyle = `rgba(19, 136, 8, ${0.04 * primaryAlpha})`;
              ctx.fill();
              ctx.stroke();
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // Variant 6: Particle Drift (Ambient Dust & Parallax Stars)
      // -----------------------------------------------------------------------
      else {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx * 0.6;
          p.y += p.vy * 0.6;

          if (p.x < 0) p.x = width;
          else if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          else if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (Math.sin(time + p.phase) * 0.3 + 1), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * primaryAlpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      observer.disconnect();
      if (container) {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseleave', onMouseLeave);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', onMouseLeave);
      }
    };
  }, [variant, mode, speed, size, strokeWidth, length, density, opacity, palette, interactive]);

  const modeClass = mode === 'dark' ? 'constellation-field-dark' : 'constellation-field-light';

  return (
    <div
      ref={containerRef}
      className={`effect-frame constellation-canvas-container ${modeClass} ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className={`constellation-canvas ${interactive ? 'interactive' : ''}`}
      />
    </div>
  );
};
