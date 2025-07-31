const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const box = 20; // 每格大小
const canvasSize = 600;
let snake, direction, food, score, gameInterval, timerInterval, timeLeft;
let gameStarted = false;

function resetGame() {
    snake = [{ x: 14 * box, y: 15 * box }];
    direction = 'RIGHT';
    food = randomPosition();
    score = 0;
    timeLeft = 60;
    document.getElementById('score').innerText = '分数: 0 | 剩余时间: 60s';
}

function randomPosition() {
    return {
        x: Math.floor(Math.random() * (canvasSize / box)) * box,
        y: Math.floor(Math.random() * (canvasSize / box)) * box
    };
}

document.addEventListener('keydown', function(e) {
    if (!gameStarted && (e.key === 'Enter')) {
        startGame();
        return;
    }
    if (!gameStarted) return;
    changeDirection(e);
});

function changeDirection(e) {
    // 支持方向键和 WASD
    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && direction !== 'RIGHT') direction = 'LEFT';
    else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && direction !== 'DOWN') direction = 'UP';
    else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && direction !== 'LEFT') direction = 'RIGHT';
    else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && direction !== 'UP') direction = 'DOWN';
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 画蛇
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#4caf50' : '#8bc34a';
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }

    // 画食物
    ctx.fillStyle = '#ff5252';
    ctx.fillRect(food.x, food.y, box, box);

    // 移动蛇
    let head = { x: snake[0].x, y: snake[0].y };
    if (direction === 'LEFT') head.x -= box;
    if (direction === 'UP') head.y -= box;
    if (direction === 'RIGHT') head.x += box;
    if (direction === 'DOWN') head.y += box;

    // 穿墙处理
    if (head.x < 0) head.x = canvasSize - box;
    if (head.x >= canvasSize) head.x = 0;
    if (head.y < 0) head.y = canvasSize - box;
    if (head.y >= canvasSize) head.y = 0;

    // 吃到食物
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').innerText = '分数: ' + score + ' | 剩余时间: ' + timeLeft + 's';
        food = randomPosition();
    } else {
        snake.pop();
    }

    // 撞到自己
    if (collision(head, snake)) {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        gameStarted = false;
        setTimeout(() => {
            alert('游戏结束！分数：' + score);
            location.reload();
        }, 100);
        return;
    }

    snake.unshift(head);
}

function collision(head, arr) {
    for (let i = 0; i < arr.length; i++) {
        if (head.x === arr[i].x && head.y === arr[i].y) {
            return true;
        }
    }
    return false;
}

function startGame() {
    resetGame();
    gameStarted = true;
    document.getElementById('tip').style.display = 'none';
    if (gameInterval) clearInterval(gameInterval);
    if (timerInterval) clearInterval(timerInterval);
    gameInterval = setInterval(draw, 120);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('score').innerText = '分数: ' + score + ' | 剩余时间: ' + timeLeft + 's';
        if (timeLeft <= 0) {
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            gameStarted = false;
            setTimeout(() => {
                alert('时间到！分数：' + score);
                location.reload();
            }, 100);
        }
    }, 1000);
}

// 初始显示提示，等待 Enter
resetGame();
document.getElementById('tip').style.display = 'block';
// 调整canvas大小
canvas.width = canvasSize;
canvas.height = canvasSize;
