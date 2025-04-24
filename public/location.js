const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const lineCount = 30;
const lineLength = 180;
const lineSpeed = 4;
const lineColor = 'rgba(255, 255, 255, 0.15)';
let lines = [];

function createLines() {
  lines = [];
  for (let i = 0; i < lineCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    lines.push({
      x,
      y,
      angle,
      speed: Math.random() * lineSpeed + 1,
      length: lineLength
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  lines.forEach(line => {
    const xEnd = line.x + Math.cos(line.angle) * line.length;
    const yEnd = line.y + Math.sin(line.angle) * line.length;

    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    line.x += Math.cos(line.angle) * line.speed;
    line.y += Math.sin(line.angle) * line.speed;

    if (line.x > canvas.width || line.x < 0 || line.y > canvas.height || line.y < 0) {
      line.x = Math.random() * canvas.width;
      line.y = Math.random() * canvas.height;
    }
  });

  requestAnimationFrame(draw);
}

createLines();
draw();
