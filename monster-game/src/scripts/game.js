// 2D俯视角打怪闯关小游戏

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelSpan = document.getElementById('level');
const scoreSpan = document.getElementById('score');
const hpSpan = document.getElementById('hp');
const restartBtn = document.getElementById('restartBtn');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
const shootBtn = document.getElementById('shootBtn');

const PLAYER_SIZE = 28;
const MONSTER_SIZE = 26;
const BULLET_SIZE = 8;
const PLAYER_SPEED = 3.2;
const BULLET_SPEED = 6;
const MONSTER_SPEED_BASE = 1.1;
const MONSTER_HP_BASE = 1;
const LEVEL_MONSTER_INC = 2;
const LEVEL_MONSTER_HP_INC = 0.5;
const PLAYER_MAX_HP = 10;

let keys = {};
let gameState;

function resetGame() {
    gameState = {
        level: 1,
        score: 0,
        player: { x: 300, y: 200, hp: PLAYER_MAX_HP },
        monsters: [],
        bullets: [],
        isGameOver: false
    };
    // 重置摇杆圆点位置
    if (joystickStick) {
        joystickStick.style.left = '30px';
        joystickStick.style.top = '30px';
    }
    if (typeof joyDir !== 'undefined') joyDir = {x:0, y:0};
    spawnMonsters();
    updateUI();
    restartBtn.style.display = 'none';
    loop();
}

function spawnMonsters() {
    const count = 3 + (gameState.level - 1) * LEVEL_MONSTER_INC;
    gameState.monsters = [];
    for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = 120 + Math.random() * 180;
        let x = 300 + Math.cos(angle) * dist;
        let y = 200 + Math.sin(angle) * dist;
        gameState.monsters.push({
            x, y,
            hp: MONSTER_HP_BASE + (gameState.level - 1) * LEVEL_MONSTER_HP_INC,
            speed: MONSTER_SPEED_BASE + Math.random() * 0.5 + (gameState.level-1)*0.1
        });
    }
}

function updateUI() {
    levelSpan.textContent = `关卡: ${gameState.level}`;
    scoreSpan.textContent = `得分: ${gameState.score}`;
    hpSpan.textContent = `生命: ${gameState.player.hp}`;
}


document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if ((e.key === ' ' || e.key === 'j') && !gameState.isGameOver) shoot();
});
document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});
restartBtn.onclick = resetGame;

// 鼠标左键射击
canvas.addEventListener('mousedown', e => {
    if (e.button === 0 && !gameState.isGameOver) shoot();
});

// 射击按钮
if (shootBtn) {
    shootBtn.addEventListener('touchstart', e => { e.preventDefault(); shoot(); });
    shootBtn.addEventListener('mousedown', e => { e.preventDefault(); shoot(); });
}

// 虚拟摇杆
let joystickActive = false, joyStart = {x:0, y:0}, joyDir = {x:0, y:0};
if (joystickBase && joystickStick) {
    // 触摸事件
    joystickBase.addEventListener('touchstart', function(e) {
        joystickActive = true;
        const t = e.touches[0];
        const rect = joystickBase.getBoundingClientRect();
        joyStart = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    });
    joystickBase.addEventListener('touchmove', function(e) {
        if (!joystickActive) return;
        const t = e.touches[0];
        const rect = joystickBase.getBoundingClientRect();
        let dx = t.clientX - rect.left - 50;
        let dy = t.clientY - rect.top - 50;
        let len = Math.sqrt(dx*dx + dy*dy);
        if (len > 40) { dx = dx/len*40; dy = dy/len*40; }
        joystickStick.style.left = (40+dx) + 'px';
        joystickStick.style.top = (40+dy) + 'px';
        joyDir = { x: dx/40, y: dy/40 };
    });
    joystickBase.addEventListener('touchend', function(e) {
        joystickActive = false;
        joystickStick.style.left = '40px';
        joystickStick.style.top = '40px';
        joyDir = {x:0, y:0};
    });

    // 鼠标事件（PC端）
    joystickBase.addEventListener('mousedown', function(e) {
        joystickActive = true;
        const rect = joystickBase.getBoundingClientRect();
        joyStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });
    window.addEventListener('mousemove', function(e) {
        if (!joystickActive) return;
        const rect = joystickBase.getBoundingClientRect();
        let dx = e.clientX - rect.left - 50;
        let dy = e.clientY - rect.top - 50;
        let len = Math.sqrt(dx*dx + dy*dy);
        if (len > 40) { dx = dx/len*40; dy = dy/len*40; }
        joystickStick.style.left = (40+dx) + 'px';
        joystickStick.style.top = (40+dy) + 'px';
        joyDir = { x: dx/40, y: dy/40 };
    });
    window.addEventListener('mouseup', function(e) {
        if (!joystickActive) return;
        joystickActive = false;
        joystickStick.style.left = '40px';
        joystickStick.style.top = '40px';
        joyDir = {x:0, y:0};
    });
}

function shoot() {
    // 子弹朝向最近怪物
    if (gameState.monsters.length === 0) return;
    let px = gameState.player.x, py = gameState.player.y;
    let nearest = gameState.monsters.reduce((a, b) => {
        let da = (a.x-px)**2 + (a.y-py)**2;
        let db = (b.x-px)**2 + (b.y-py)**2;
        return da < db ? a : b;
    });
    let dx = nearest.x - px, dy = nearest.y - py;
    let len = Math.sqrt(dx*dx + dy*dy);
    dx /= len; dy /= len;
    gameState.bullets.push({
        x: px, y: py, dx, dy
    });
}

function update() {
    // 玩家移动
    let p = gameState.player;
    // 虚拟摇杆优先
    let moved = false;
    if (Math.abs(joyDir.x) > 0.15 || Math.abs(joyDir.y) > 0.15) {
        let dx = joyDir.x, dy = joyDir.y;
        let len = Math.sqrt(dx*dx + dy*dy);
        if (len > 1) { dx /= len; dy /= len; }
        if (p.x-PLAYER_SIZE/2 > 0 && p.x+dx*PLAYER_SPEED-PLAYER_SIZE/2 > 0 && p.x+dx*PLAYER_SPEED+PLAYER_SIZE/2 < canvas.width)
            p.x += dx * PLAYER_SPEED;
        if (p.y-PLAYER_SIZE/2 > 0 && p.y+dy*PLAYER_SPEED-PLAYER_SIZE/2 > 0 && p.y+dy*PLAYER_SPEED+PLAYER_SIZE/2 < canvas.height)
            p.y += dy * PLAYER_SPEED;
        moved = true;
    }
    if (!moved) {
        if (keys['w'] && p.y-PLAYER_SIZE/2 > 0) p.y -= PLAYER_SPEED;
        if (keys['s'] && p.y+PLAYER_SIZE/2 < canvas.height) p.y += PLAYER_SPEED;
        if (keys['a'] && p.x-PLAYER_SIZE/2 > 0) p.x -= PLAYER_SPEED;
        if (keys['d'] && p.x+PLAYER_SIZE/2 < canvas.width) p.x += PLAYER_SPEED;
    }

    // 子弹移动
    for (let b of gameState.bullets) {
        b.x += b.dx * BULLET_SPEED;
        b.y += b.dy * BULLET_SPEED;
    }
    // 移除出界子弹
    gameState.bullets = gameState.bullets.filter(b => b.x>-10 && b.x<canvas.width+10 && b.y>-10 && b.y<canvas.height+10);

    // 怪物移动
    for (let m of gameState.monsters) {
        let dx = p.x - m.x, dy = p.y - m.y;
        let len = Math.sqrt(dx*dx + dy*dy);
        m.x += dx/len * m.speed;
        m.y += dy/len * m.speed;
    }

    // 子弹打怪
    for (let b of gameState.bullets) {
        for (let m of gameState.monsters) {
            if (Math.abs(b.x-m.x)<(MONSTER_SIZE+BULLET_SIZE)/2 && Math.abs(b.y-m.y)<(MONSTER_SIZE+BULLET_SIZE)/2) {
                m.hp -= 1;
                b.hit = true;
                if (m.hp <= 0) {
                    m.dead = true;
                    gameState.score += 10;
                }
            }
        }
    }
    gameState.bullets = gameState.bullets.filter(b => !b.hit);
    gameState.monsters = gameState.monsters.filter(m => !m.dead);

    // 怪物碰玩家
    for (let m of gameState.monsters) {
        if (Math.abs(m.x-p.x)<(MONSTER_SIZE+PLAYER_SIZE)/2 && Math.abs(m.y-p.y)<(MONSTER_SIZE+PLAYER_SIZE)/2) {
            m.dead = true;
            p.hp--;
            if (p.hp <= 0) {
                gameState.isGameOver = true;
                restartBtn.style.display = '';
            }
        }
    }
    gameState.monsters = gameState.monsters.filter(m => !m.dead);

    // 过关
    if (gameState.monsters.length === 0 && !gameState.isGameOver) {
        gameState.level++;
        spawnMonsters();
    }
    updateUI();
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // 玩家
    let p = gameState.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#4cafef';
    ctx.beginPath();
    ctx.arc(0,0,PLAYER_SIZE/2,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    // 怪物
    for (let m of gameState.monsters) {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(0,0,MONSTER_SIZE/2,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
    // 子弹
    for (let b of gameState.bullets) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = '#fff176';
        ctx.beginPath();
        ctx.arc(0,0,BULLET_SIZE/2,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
    // Game Over
    if (gameState.isGameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width/2, canvas.height/2-20);
        ctx.font = '24px Arial';
        ctx.fillText('得分: '+gameState.score, canvas.width/2, canvas.height/2+20);
    }
}

function loop() {
    if (!gameState.isGameOver) {
        update();
        draw();
        requestAnimationFrame(loop);
    } else {
        draw();
    }
}

resetGame();
