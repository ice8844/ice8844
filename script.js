// ตั้งค่าหน้าจอเกม 
let board; 
let boardWidth = 800; 
let boardHeight = 300; 
let context; 

// ตั้งค่าระบบเสียง (Web Audio API)
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// 1. เสียงกระโดดสไตล์ 8-bit
function playJumpSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    
    osc.type = "square";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// 2. เสียงชน / เสียชีวิต สไตล์ 8-bit
function playHitSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// 3. เสียงชนะสไตล์ 8-bit Fanfare
function playWinSound() {
    if (!audioCtx) return;
    let notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // โน้ต C E G C E G
    let time = audioCtx.currentTime;
    
    notes.forEach((freq, index) => {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        
        osc.type = "square";
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.1, time + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, time + index * 0.1 + 0.15);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(time + index * 0.1);
        osc.stop(time + index * 0.1 + 0.15);
    });
}

// ตั้งค่าตัวละครเกม 
let playerWidth = 85; 
let playerHeight = 85; 
let playerX = 50; 
let playerY = boardHeight - playerHeight; 
let playerImg; 
let player = { 
    x: playerX, 
    y: playerY, 
    width: playerWidth, 
    height: playerHeight 
};

// สถานะเกม และระบบเพิ่มเติม (HP & Time)
let gameOver = false; 
let gameWon = false;
let score = 0; 
let lives = 3;             
let timeRemaining = 60;    
let timerInterval;

// สร้างอุปสรรค 
let boxImg; 
let boxWidth = 40; 
let boxHeight = 80; 
let boxX = 700; 
let boxY = boardHeight - boxHeight; 
let boxesArray = []; 
let boxSpeed = -5; 

// Gravity & Velocity 
let velocityY = 0; 
let gravity = 0.4; 

// การกำหนดเหตุการณ์เริ่มต้นเกม 
window.onload = function() { 
    board = document.getElementById('board'); 
    board.height = boardHeight; 
    board.width = boardWidth; 
    context = board.getContext("2d"); 

    // โหลดภาพตัวละคร
    playerImg = new Image(); 
    playerImg.src = "main.png"; 

    // โหลดภาพอุปสรรค
    boxImg = new Image(); 
    boxImg.src = "a3.png"; 

    // ดักจับการกระโดด
    document.addEventListener("keydown", movePlayer); 

    // สุ่มสร้างอุปสรรคทุก 2 วินาที
    setInterval(createBox, 2000); 

    // ระบบนับถอยหลังเวลา 60 วินาที
    timerInterval = setInterval(function() {
        if (!gameOver && !gameWon) {
            timeRemaining--;
            if (timeRemaining <= 0) {
                gameWon = true;
                clearInterval(timerInterval);
                playWinSound(); // เล่นเสียงชนะ
            }
        }
    }, 1000);

    // เริ่ม Game Loop
    requestAnimationFrame(update); 
};

// ฟังก์ชัน Loop หลักของเกม
function update() { 
    requestAnimationFrame(update); 

    if (gameOver || gameWon) { 
        context.font = "bold 40px Arial"; 
        context.textAlign = "center"; 
        if (gameOver) {
            context.fillStyle = "red";
            context.fillText("GAME OVER!", boardWidth / 2, boardHeight / 2); 
        } else if (gameWon) {
            context.fillStyle = "green";
            context.fillText("YOU WIN!", boardWidth / 2, boardHeight / 2); 
        }
        return; 
    } 

    // เคลียร์หน้าจอ
    context.clearRect(0, 0, board.width, board.height); 

    // การคำนวณตำแหน่งการฟิสิกส์
    velocityY += gravity; 
    player.y = Math.min(player.y + velocityY, playerY); 
    context.drawImage(playerImg, player.x, player.y, player.width, player.height); 

    // การจัดการอุปสรรค
    for (let i = 0; i < boxesArray.length; i++) { 
        let box = boxesArray[i]; 
        box.x += boxSpeed; 
        context.drawImage(box.img, box.x, box.y, box.width, box.height); 

        // ตรวจสอบการชน
        if (onCollision(player, box)) { 
            boxesArray.splice(i, 1); 
            lives--; 
            playHitSound(); // เล่นเสียงชน
            
            if (lives <= 0) {
                gameOver = true;
                clearInterval(timerInterval);
            }
            break;
        } 
    } 

    // ลบอุปสรรคที่หลุดขอบจอ
    while (boxesArray.length > 0 && boxesArray[0].x < -boxWidth) {
        boxesArray.shift();
        score += 10; 
    }

    // แสดงผลข้อมูล (คะแนน, เวลา, พลังชีวิต)
    context.font = "bold 20px Arial"; 
    context.fillStyle = "black"; 
    
    context.textAlign = "left"; 
    context.fillText("Time: " + timeRemaining + "s", 20, 30); 

    context.textAlign = "center"; 
    context.fillText("Lives: " + "❤️".repeat(lives), boardWidth / 2, 30);

    context.textAlign = "right"; 
    context.fillText("Score: " + score, boardWidth - 20, 30); 
} 

// ควบคุมการเคลื่อนที่ (ปุ่ม Spacebar)
function movePlayer(e) { 
    initAudio(); // เริ่มต้นการทำงานของ AudioContext เมื่อผู้เล่นกดปุ่มครั้งแรก

    if (gameOver || gameWon) { 
        return; 
    } 

    if ((e.code == "Space" || e.code == "ArrowUp") && player.y == playerY) { 
        velocityY = -12; 
        playJumpSound(); // เล่นเสียงกระโดด
    } 
} 

// สร้างอุปสรรค
function createBox() { 
    if (gameOver || gameWon) { 
        return; 
    } 
    let box = { 
        img: boxImg, 
        x: boxX, 
        y: boxY, 
        width: boxWidth, 
        height: boxHeight 
    };
    boxesArray.push(box); 
} 

// ตรวจสอบการชนกันของวัตถุ 2 ชิ้น
function onCollision(a, b) { 
    return a.x < b.x + b.width && 
           a.x + a.width > b.x && 
           a.y < b.y + b.height && 
           a.y + a.height > b.y; 
}