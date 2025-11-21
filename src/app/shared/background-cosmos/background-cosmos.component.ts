import { Component, OnInit, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-background-cosmos',
  templateUrl: './background-cosmos.component.html',
  styleUrls: ['./background-cosmos.component.scss']
})
export class BackgroundCosmosComponent implements OnInit, AfterViewInit {

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    const canvas = document.getElementById('cosmosCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    class Particle {
      constructor(
        public x: number,
        public y: number,
        public radius: number,
        public speed: number,
        public angle: number = Math.random() * Math.PI * 2
      ) { }

      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        // Wrap around instead of bouncing off edges for better scrolling experience
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(210, 217, 221, 0.3)';
        ctx.fill();
      }
    }

    const particles: Particle[] = [];

    function resizeCanvas() {
      // Make canvas larger than viewport to cover scrolling content
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight * 2, document.body.scrollHeight);
      canvas.style.width = '100vw';
      canvas.style.height = canvas.height + 'px';

      // Adjust particle count based on screen size
      const isMobile = window.innerWidth < 768;
      const targetParticleCount = isMobile ? 35 : 80;

      // Add or remove particles as needed
      while (particles.length < targetParticleCount) {
        particles.push(new Particle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 2 + 1,
          Math.random() * 0.3 + 0.1
        ));
      }
      while (particles.length > targetParticleCount) {
        particles.pop();
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', () => {
      // Dynamically adjust canvas height if content grows
      const currentHeight = Math.max(window.innerHeight * 2, document.body.scrollHeight);
      if (currentHeight > canvas.height) {
        canvas.height = currentHeight;
        canvas.style.height = currentHeight + 'px';
      }
    });

    function connectParticles() {
      const isMobile = window.innerWidth < 768;
      const connectionDistance = isMobile ? 100 : 150; // Reduce connection distance on mobile

      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dist = Math.hypot(
            particles[a].x - particles[b].x,
            particles[a].y - particles[b].y
          );
          if (dist < connectionDistance) {
            ctx.strokeStyle = 'rgba(210, 217, 221, 0.3)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });
      connectParticles();
      requestAnimationFrame(animate);
    }

    animate();
  }
}