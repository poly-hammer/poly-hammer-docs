'use client';

import { useEffect, useRef } from 'react';

type Point = { x: number; y: number; vx: number; vy: number };
const linkDistance = 105;
const margin = 60;

/** Decorative only; the surrounding header supplies all accessible content. */
export function HeaderPolygons() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let points: Point[] = [];
    let width = 0, height = 0, frame = 0, lastTime = 0;
    let visible = false;
    let color = '';

    function draw() {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const other = points[j];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance >= linkDistance) continue;
          context.globalAlpha = 1 - distance / linkDistance;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
        context.globalAlpha = .65;
        context.beginPath();
        context.arc(point.x, point.y, 1, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }

    function tick(time: number) {
      if (!lastTime) lastTime = time;
      const elapsed = (time - lastTime) / 1000;
      // Cap drawing at 30 fps and avoid jumps after a suspended tab resumes.
      if (elapsed >= 1 / 30) {
        const delta = Math.min(elapsed, .1);
        for (const point of points) {
          point.x += point.vx * delta;
          point.y += point.vy * delta;
          if (point.x < -margin) point.x = width + margin;
          if (point.x > width + margin) point.x = -margin;
          if (point.y < -margin) point.y = height + margin;
          if (point.y > height + margin) point.y = -margin;
        }
        draw();
        lastTime = time;
      }
      frame = requestAnimationFrame(tick);
    }

    function updateMotion() {
      cancelAnimationFrame(frame);
      lastTime = 0;
      draw();
      if (visible && !document.hidden && !reducedMotion.matches && width && height) {
        frame = requestAnimationFrame(tick);
      }
    }

    function updateColor() {
      color = getComputedStyle(canvas!).getPropertyValue('--ph-header-line').trim();
      draw();
    }

    const resize = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(84, Math.max(20, Math.round((width + margin * 2) * (height + margin * 2) / 6500)));
      points = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 5;
        return {
          x: Math.random() * (width + margin * 2) - margin,
          y: Math.random() * (height + margin * 2) - margin,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        };
      });
      updateColor();
      updateMotion();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateMotion();
    });
    const theme = new MutationObserver(updateColor);
    resize.observe(canvas);
    intersection.observe(canvas);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    reducedMotion.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateMotion);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      theme.disconnect();
      reducedMotion.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateMotion);
    };
  }, []);

  return <div className="docs-header-art" aria-hidden="true">
    <canvas ref={canvasRef} />
  </div>;
}
