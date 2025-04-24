const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Настройка канваса
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Параметры для линий
const lineCount = 40;  // Количество линий
const lineLength = 200; // Длина линий
const lineSpeed = 5;    // Скорость движения линий
const lineColor = 'rgba(255, 255, 255, 0.2)'; // Цвет линий

let lines = [];

function createLines() {
  lines = [];
  for (let i = 0; i < lineCount; i++) {
    const angle = Math.random() * Math.PI * 2;  // Случайный угол
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    lines.push({
      x,
      y,
      angle,
      speed: Math.random() * lineSpeed + 1,  // Случайная скорость для каждой линии
      length: lineLength
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Рисуем линии
  lines.forEach(line => {
    const xEnd = line.x + Math.cos(line.angle) * line.length;
    const yEnd = line.y + Math.sin(line.angle) * line.length;

    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Перемещаем линию
    line.x += Math.cos(line.angle) * line.speed;
    line.y += Math.sin(line.angle) * line.speed;

    // Если линия выходит за пределы, перемещаем её обратно
    if (line.x > canvas.width || line.x < 0 || line.y > canvas.height || line.y < 0) {
      line.x = Math.random() * canvas.width;
      line.y = Math.random() * canvas.height;
    }
  });

  requestAnimationFrame(draw);
}

createLines(); // Инициализация линий
draw(); // Запуск рисования
