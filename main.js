const canvas = document.getElementById("fishCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Parâmetros
const numFish = 200;
const numPredators = 3;
const fishSpeed = 2;
const predatorSpeed = 3;
const visionRadius = 70; // Alcance de visão dos peixes
const avoidanceRadius = 40; // Distância de evitar colisões entre peixes
const predatorAvoidanceRadius = 150; // Distância para fugir de predadores

// Armazena os peixes e predadores
let fishSchool = [];
let predators = [];

// Classe de peixe (presas)
class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.color = 'rgba(0, 200, 255, 0.9)';
        this.angle = Math.random() * Math.PI * 2;
        this.speed = fishSpeed;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
    }

    // Desenhar o peixe como triângulo
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size / 2);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(-this.size, this.size / 2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    // Regras de cardume
    flock(fishSchool, predators) {
        let alignment = { x: 0, y: 0 };
        let cohesion = { x: 0, y: 0 };
        let separation = { x: 0, y: 0 };
        let total = 0;
        
        fishSchool.forEach(otherFish => {
            let dx = otherFish.x - this.x;
            let dy = otherFish.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Considera peixes próximos
            if (distance < visionRadius && otherFish !== this) {
                alignment.x += otherFish.velocityX;
                alignment.y += otherFish.velocityY;

                cohesion.x += otherFish.x;
                cohesion.y += otherFish.y;

                if (distance < avoidanceRadius) {
                    separation.x -= dx;
                    separation.y -= dy;
                }

                total++;
            }
        });

        if (total > 0) {
            // Alinhamento
            alignment.x /= total;
            alignment.y /= total;
            this.velocityX += (alignment.x - this.velocityX) * 0.05;
            this.velocityY += (alignment.y - this.velocityY) * 0.05;

            // Coesão
            cohesion.x /= total;
            cohesion.y /= total;
            this.velocityX += (cohesion.x - this.x) * 0.01;
            this.velocityY += (cohesion.y - this.y) * 0.01;

            // Separação
            this.velocityX += separation.x * 0.1;
            this.velocityY += separation.y * 0.1;
        }

        // Evitar predadores
        predators.forEach(predator => {
            let dx = predator.x - this.x;
            let dy = predator.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < predatorAvoidanceRadius) {
                this.velocityX -= dx * 0.2;
                this.velocityY -= dy * 0.2;
            }
        });

        // Limita a velocidade
        const maxSpeed = fishSpeed * 2;
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > maxSpeed) {
            this.velocityX = (this.velocityX / speed) * maxSpeed;
            this.velocityY = (this.velocityY / speed) * maxSpeed;
        }

        // Atualizar posição
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.angle = Math.atan2(this.velocityY, this.velocityX);

        // Verificar bordas
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }
}

// Classe de predador
class Predator {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.color = 'rgba(255, 50, 50, 0.9)';
        this.angle = Math.random() * Math.PI * 2;
        this.speed = predatorSpeed;
    }

    // Desenhar o predador
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size / 2);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(-this.size, this.size / 2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    // Perseguir peixes
    chase(fishSchool) {
        let nearestFish = null;
        let minDist = Infinity;

        fishSchool.forEach(fish => {
            let dx = fish.x - this.x;
            let dy = fish.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearestFish = fish;
            }
        });

        if (nearestFish) {
            let dx = nearestFish.x - this.x;
            let dy = nearestFish.y - this.y;
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }

        // Verificar bordas
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }
}

// Inicializar os peixes
function initFish() {
    for (let i = 0; i < numFish; i++) {
        fishSchool.push(new Fish(Math.random() * canvas.width, Math.random() * canvas.height));
    }
}

// Inicializar predadores
function initPredators() {
    for (let i = 0; i < numPredators; i++) {
        predators.push(new Predator(Math.random() * canvas.width, Math.random() * canvas.height));
    }
}

// Função de animação
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fishSchool.forEach(fish => {
        fish.flock(fishSchool, predators);
        fish.draw();
    });

    predators.forEach(predator => {
        predator.chase(fishSchool);
        predator.draw();
    });

    requestAnimationFrame(animate);
}

// Inicializar e animar
initFish();
initPredators();
animate();

// Ajustar o canvas ao redimensionar
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
