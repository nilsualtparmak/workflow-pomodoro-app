/**
 * FocusFlow – Confetti animasyonu
 */

const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  animating: false,

  init() {
    this.canvas = document.getElementById('confetti-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener('resize', () => this.resize());
    this.resize();
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  fire() {
    if (!this.canvas) return;

    const colors = ['#6366f1', '#818cf8', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
    this.particles = [];

    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 100,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.animate();
    }
  },

  animate() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.005;

      if (p.opacity <= 0 || p.y > this.canvas.height + 20) return false;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
      return true;
    });

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};
