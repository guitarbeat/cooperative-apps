import React, { useEffect, useRef } from 'react';
import { debounce } from '../lib/utils';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles = particlesRef.current;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    // ⚡ Bolt Optimization: Debounce resize to prevent excessive layout thrashing
    const debouncedResize = debounce(resizeCanvas, 250);
    window.addEventListener('resize', debouncedResize);

    // Particle class
    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
        this.fadeDelay = Math.random() * 600;
        this.fadeStart = Date.now() + this.fadeDelay;
        this.fadingIn = true;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 10;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = Math.random() * -1 - 0.5;
        this.life = Math.random() * 0.6 + 0.4;
        this.fade = 0;
        this.size = Math.random() * 2 + 1;
        this.color = `rgba(107, 142, 71, ${this.life})`;
      }

      // ⚡ Bolt Optimization: Accept 'now' timestamp to avoid Date.now() calls per particle
      update(now) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.fadingIn) {
          if (now > this.fadeStart) {
            this.fade += 0.005;
            if (this.fade >= this.life) {
              this.fade = this.life;
              this.fadingIn = false;
            }
          }
        } else {
          this.fade -= 0.005;
          if (this.fade <= 0) {
            this.reset();
            this.fadeDelay = Math.random() * 600;
            this.fadeStart = now + this.fadeDelay;
            this.fadingIn = true;
          }
        }

        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
          this.reset();
          this.fadeDelay = Math.random() * 600;
          this.fadeStart = now + this.fadeDelay;
          this.fadingIn = true;
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.fade;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Create particles
    const particleCount = Math.min(50, Math.floor(canvas.width * canvas.height / 15000));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ⚡ Bolt Optimization: Calculate timestamp once per frame
      const now = Date.now();

      particles.forEach(particle => {
        particle.update(now);
        particle.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default ParticleBackground;

