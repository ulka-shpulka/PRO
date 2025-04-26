// ========== CANVAS SETUP ==========
function setupCanvas() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return { canvas: null, ctx: null };
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return { canvas, ctx };
}

let { canvas, ctx } = setupCanvas();
let lines = [];
const lineColor = 'rgba(255, 255, 255, 0.2)';
const lineSpeed = 5;
const lineLength = 200;

function adjustLineCount() {
  return window.innerWidth <= 600 ? 20 : window.innerWidth <= 1000 ? 30 : 40;
}

function createLines() {
  if (!canvas) return;
  lines = [];
  const lineCount = adjustLineCount();
  for (let i = 0; i < lineCount; i++) {
    lines.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      angle: Math.random() * 2 * Math.PI,
      speed: Math.random() * lineSpeed + 1,
      length: lineLength
    });
  }
}

function draw() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach(line => {
    const xEnd = line.x + Math.cos(line.angle) * line.length;
    const yEnd = line.y + Math.sin(line.angle) * line.length;
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    line.x += Math.cos(line.angle) * line.speed;
    line.y += Math.sin(line.angle) * line.speed;

    if (line.x < 0 || line.x > canvas.width || line.y < 0 || line.y > canvas.height) {
      line.x = Math.random() * canvas.width;
      line.y = Math.random() * canvas.height;
    }
  });
  requestAnimationFrame(draw);
}

// ========== MENU TOGGLE ==========
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('menu-overlay');

  function checkMobileView() {
    if (window.innerWidth <= 1000) {
      hamburger.style.display = 'flex';
    } else {
      hamburger.style.display = 'none';
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  }

  if (hamburger && mobileMenu && overlay) {
    function toggleMenu() {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    }

    hamburger.addEventListener('click', function(e) {
      e.preventDefault();
      toggleMenu();
    });

    overlay.addEventListener('click', toggleMenu);

    const mobileMenuButtons = mobileMenu.querySelectorAll('.menu-button');
    mobileMenuButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (window.innerWidth <= 1000 && mobileMenu.classList.contains('active')) {
          toggleMenu();
        }
      });
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        toggleMenu();
      }
    });

    checkMobileView();
    window.addEventListener('resize', function() {
      checkMobileView();
      createLines();
    });
  }

  if (canvas && ctx) {
    createLines();
    draw();
  }
});
