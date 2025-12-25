// Lấy user
const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
const email = currentUser.email || "guest";

// Voucher có sẵn
const defaultVouchers = [
    { code: "SILVER10", type: "percent", value: 10, desc: "Giảm 10% cho đơn hàng", expire: "31/12/2025" },
    { code: "SILVER20", type: "percent", value: 20, desc: "Giảm 20% cho đơn hàng", expire: "31/12/2025" },
    { code: "FREESHIP", type: "minus", value: 30000, desc: "Miễn phí vận chuyển 30K", expire: "31/12/2025" }
];

// Voucher nhận được từ LuckyWheel
const userWheelVouchers = JSON.parse(localStorage.getItem("wheelVouchers")) || {};
const userVouchers = userWheelVouchers[email] || [];

// Kết hợp voucher có sẵn + nhận từ vòng quay
const allVouchers = [...defaultVouchers];

// Thêm voucher từ vòng quay
userVouchers.forEach(v => {
    allVouchers.push({
        code: v.code,
        type: v.type,
        value: v.value,
        desc: v.desc || "Voucher nhận từ vòng quay may mắn",
        expire: v.expire || "30/12/2025"
    });
});

// Render
const voucherListEl = document.getElementById("voucher-list");
const noVoucherEl = document.getElementById("no-voucher");

if (!allVouchers.length) {
    noVoucherEl.textContent = "Bạn chưa sở hữu voucher nào.";
} else {
    allVouchers.forEach(v => {
        const div = document.createElement("div");
        div.className = "voucher-card";
        div.innerHTML = `
            <div class="voucher-title">${v.code}</div>
            <div class="voucher-desc">${v.desc}</div>
            <div class="voucher-expire">Hạn sử dụng: ${v.expire}</div>
        `;
        voucherListEl.appendChild(div);
    });
}
