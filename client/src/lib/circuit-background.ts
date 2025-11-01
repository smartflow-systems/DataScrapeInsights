// SmartFlow Circuit Background Animation
// Flowing golden circuit paths with animated particles

interface Path {
  startX: number;
  startY: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  endX: number;
  endY: number;
  opacity: number;
}

interface Node {
  x: number;
  y: number;
  radius: number;
  pulse: number;
  pulseSpeed: number;
}

interface Particle {
  pathIndex: number;
  progress: number;
  speed: number;
  size: number;
  opacity: number;
}

export function initCircuitBackground(): () => void {
  // Skip on mobile for performance
  if (window.innerWidth <= 768) {
    return () => {};
  }

  const canvas = document.getElementById('circuit-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.warn('Circuit canvas not found');
    return () => {};
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('Could not get 2d context');
    return () => {};
  }

  let animationId: number | null = null;
  let isVisible = true;

  const colors = {
    path: 'rgba(230, 194, 0, 0.5)',        // Gold paths - more visible
    pathGlow: 'rgba(255, 215, 0, 0.3)',    // Gold glow - brighter
    particle: '#FFD700',                    // Bright gold particles
    node: 'rgba(255, 215, 0, 0.9)',        // Gold nodes - brighter
    nodeGlow: 'rgba(255, 215, 0, 0.5)'     // Node glow - stronger
  };

  let paths: Path[] = [];
  let particles: Particle[] = [];
  let nodes: Node[] = [];

  // Set canvas size
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generatePaths();
    generateNodes();
  };

  resize();
  window.addEventListener('resize', resize);

  // Generate curved paths for circuits
  function generatePaths() {
    paths = [];
    const pathCount = 12;

    for (let i = 0; i < pathCount; i++) {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height;
      const endX = Math.random() * canvas.width;
      const endY = Math.random() * canvas.height;

      // Control points for Bezier curve
      const cp1x = startX + (Math.random() - 0.5) * canvas.width * 0.5;
      const cp1y = startY + (Math.random() - 0.5) * canvas.height * 0.5;
      const cp2x = endX + (Math.random() - 0.5) * canvas.width * 0.5;
      const cp2y = endY + (Math.random() - 0.5) * canvas.height * 0.5;

      paths.push({
        startX, startY,
        cp1x, cp1y,
        cp2x, cp2y,
        endX, endY,
        opacity: 0.5 + Math.random() * 0.4
      });
    }
  }

  // Generate circuit nodes (connection points)
  function generateNodes() {
    nodes = [];
    const nodeCount = 8;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 3 + Math.random() * 4,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03
      });
    }
  }

  // Generate flowing particles
  function generateParticles() {
    particles = [];
    const particleCount = 35;

    for (let i = 0; i < particleCount; i++) {
      const pathIndex = Math.floor(Math.random() * paths.length);
      particles.push({
        pathIndex: pathIndex,
        progress: Math.random(),
        speed: 0.001 + Math.random() * 0.002,
        size: 1.5 + Math.random() * 2.5,
        opacity: 0.7 + Math.random() * 0.3
      });
    }
  }

  generateParticles();

  // Draw circuit paths
  function drawPaths() {
    paths.forEach(path => {
      ctx.strokeStyle = colors.path;
      ctx.lineWidth = 1;
      ctx.globalAlpha = path.opacity;

      ctx.beginPath();
      ctx.moveTo(path.startX, path.startY);
      ctx.bezierCurveTo(
        path.cp1x, path.cp1y,
        path.cp2x, path.cp2y,
        path.endX, path.endY
      );
      ctx.stroke();

      // Glow effect
      ctx.strokeStyle = colors.pathGlow;
      ctx.lineWidth = 3;
      ctx.globalAlpha = path.opacity * 0.3;
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
  }

  // Draw pulsing circuit nodes
  function drawNodes() {
    nodes.forEach(node => {
      node.pulse += node.pulseSpeed;
      const pulseSize = Math.sin(node.pulse) * 2;

      // Glow
      const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, node.radius + pulseSize + 8
      );
      gradient.addColorStop(0, colors.nodeGlow);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + pulseSize + 8, 0, Math.PI * 2);
      ctx.fill();

      // Node core
      ctx.fillStyle = colors.node;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + pulseSize, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Calculate point on Bezier curve
  function getBezierPoint(t: number, start: number, cp1: number, cp2: number, end: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return mt3 * start + 3 * mt2 * t * cp1 + 3 * mt * t2 * cp2 + t3 * end;
  }

  // Draw flowing particles along paths
  function drawParticles() {
    particles.forEach(particle => {
      const path = paths[particle.pathIndex];

      const x = getBezierPoint(
        particle.progress,
        path.startX, path.cp1x, path.cp2x, path.endX
      );
      const y = getBezierPoint(
        particle.progress,
        path.startY, path.cp1y, path.cp2y, path.endY
      );

      // Particle glow
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, particle.size * 3
      );
      gradient.addColorStop(0, colors.particle);
      gradient.addColorStop(1, 'transparent');

      ctx.globalAlpha = particle.opacity * 0.5;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, particle.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Particle core
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = colors.particle;
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Update progress
      particle.progress += particle.speed;
      if (particle.progress > 1) {
        particle.progress = 0;
        particle.pathIndex = Math.floor(Math.random() * paths.length);
      }
    });

    ctx.globalAlpha = 1;
  }

  // Pause animation when tab is hidden (saves CPU/battery)
  const handleVisibilityChange = () => {
    isVisible = !document.hidden;
    if (isVisible && !animationId) {
      animate();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Animation loop
  function animate() {
    if (!ctx || !canvas || !isVisible) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPaths();
    drawNodes();
    drawParticles();

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
