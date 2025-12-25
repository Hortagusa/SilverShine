const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("resultText");
const spinMessage = document.getElementById("spin-message");
const spinSound = document.getElementById("spin-sound");

const prizes = ["SILVER10", "SILVER20", "FREESHIP", "Giảm 50K", "Giảm 100K", "Miễn phí vận chuyển"];
const size = canvas.width;
const radius = size / 2;
const arc = (2 * Math.PI) / prizes.length;
let angle = 0;
let spinning = false;

// Email hiện tại
const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
const userEmail = currentUser.email || "guest";

// Lấy lượt quay hiện có
let turns = JSON.parse(localStorage.getItem("spinTurns")) || {};
let spinsLeft = turns[userEmail] || 0;

function updateSpinsDisplay() {
    spinMessage.textContent = spinsLeft > 0
        ? `Số lượt còn lại: ${spinsLeft}`
        : "Bạn chưa có lượt quay. Mua hàng ≥ 1 triệu để nhận lượt!";
}
updateSpinsDisplay();

// Vẽ bánh quay
function drawWheel() {
    for (let i = 0; i < prizes.length; i++) {
        let start = angle + i * arc;
        ctx.fillStyle = i % 2 === 0 ? "#FFC107" : "#FF9800";
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, start, start + arc);
        ctx.fill();

        // Text
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#000";
        ctx.font = "16px Arial";
        ctx.fillText(prizes[i], radius - 10, 10);
        ctx.restore();
    }
}
drawWheel();

// Spin
spinBtn.addEventListener("click", () => {
    if (spinning) return;
    if (spinsLeft <= 0) {
        updateSpinsDisplay();
        return;
    }

    spinning = true;
    resultText.textContent = "";
    let spinAngle = Math.random() * 2000 + 2000; // 2000-4000 độ
    let current = 0;

    // Phát âm thanh
    spinSound.currentTime = 0;
    spinSound.play();

    const spin = setInterval(() => {
        current += 20;
        angle = (current / 180) * Math.PI;
        ctx.clearRect(0, 0, size, size);
        drawWheel();

        if (current >= spinAngle) {
            clearInterval(spin);
            spinning = false;

            const index = Math.floor((prizes.length - ((angle % (2 * Math.PI)) / arc)) % prizes.length);
            const prizeWon = prizes[index];
            resultText.innerText = "Bạn trúng: " + prizeWon;

            // Giảm lượt quay
            spinsLeft--;
            turns[userEmail] = spinsLeft;
            localStorage.setItem("spinTurns", JSON.stringify(turns));
            updateSpinsDisplay();

            // Lưu lịch sử
            let spinsHistory = JSON.parse(localStorage.getItem("spinsHistory")) || [];
            spinsHistory.push({ prize: prizeWon, date: new Date().toISOString() });
            localStorage.setItem("spinsHistory", JSON.stringify(spinsHistory));

            // Lưu voucher nếu trúng
            if (["SILVER10", "SILVER20", "FREESHIP"].includes(prizeWon)) {
                const wheelVouchers = JSON.parse(localStorage.getItem("wheelVouchers")) || {};
                if (!wheelVouchers[userEmail]) wheelVouchers[userEmail] = [];
                wheelVouchers[userEmail].push({ code: prizeWon, date: new Date().toISOString() });
                localStorage.setItem("wheelVouchers", JSON.stringify(wheelVouchers));
            }
        }
    }, 20);
});

// Hàm cộng lượt quay khi checkout
function addSpinsFromOrder(totalAmount) {
    const extraTurns = Math.floor(totalAmount / 1000000);
    if (extraTurns <= 0) return;

    spinsLeft += extraTurns;
    turns[userEmail] = spinsLeft;
    localStorage.setItem("spinTurns", JSON.stringify(turns));
    updateSpinsDisplay();
}
