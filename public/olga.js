const contactsBtn = document.getElementById("contactsBtn");
const locationBtn = document.getElementById("locationBtn");
const contactsBlock = document.getElementById("contacts-block");
const locationBlock = document.getElementById("location-block");

contactsBtn.addEventListener("click", () => {
  toggleBlock(contactsBlock);
  locationBlock.classList.add("hidden");
});

locationBtn.addEventListener("click", () => {
  toggleBlock(locationBlock);
  contactsBlock.classList.add("hidden");
});

function toggleBlock(block) {
  block.classList.toggle("hidden");
}

document.getElementById('bookingBtn').addEventListener('click', function() {
    window.location.href = 'olga-online.html';
  });
// Анимация лепестков
const canvas = document.getElementById("petals-canvas");
const ctx = canvas.getContext("2d");
let petals = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

class Petal {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = -20;
    this.radius = 5 + Math.random() * 5;
    this.speed = 1 + Math.random() * 2;
    this.wind = Math.random() * 1 - 0.5;
    this.color = "rgba(255,182,193,0.6)";
  }

  update() {
    this.y += this.speed;
    this.x += this.wind;
    if (this.y > canvas.height || this.x > canvas.width || this.x < 0) {
      this.reset();
      this.y = -10;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.ellipse(this.x, this.y, this.radius, this.radius * 1.5, 0, 0, 2 * Math.PI);
    ctx.fill();
  }
}

for (let i = 0; i < 60; i++) {
  petals.push(new Petal());
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  petals.forEach(petal => {
    petal.update();
    petal.draw();
  });
  requestAnimationFrame(animate);
}

animate();



  