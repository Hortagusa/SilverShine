// =========================
// CHECKOUT.JS + VOUCHER + LUCKYWHEEL
// =========================

// -- Load cart --
let cart = JSON.parse(localStorage.getItem("cartData")) || [];

// -- User --
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// -- Elements --
const checkoutItems = document.getElementById("checkout-items");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutForm = document.getElementById("checkout-form");

const checkoutName = document.getElementById("checkout-name");
const checkoutEmail = document.getElementById("checkout-email");
const checkoutPhone = document.getElementById("checkout-phone");
const checkoutAddress = document.getElementById("checkout-address");

// Voucher UI
const voucherInput = document.getElementById("voucher-input");
const voucherBtn = document.getElementById("apply-voucher");
const voucherMsg = document.getElementById("voucher-message");
const baseTotalEl = document.getElementById("checkout-base-total"); // cần trong HTML
const discountRow = document.getElementById("discount-row");         // cần trong HTML
const discountEl = document.getElementById("checkout-discount");     // cần trong HTML

// Voucher data
let appliedVoucher = null;
let discountAmount = 0;

// Auto fill user
if (currentUser) {
    checkoutName.value = currentUser.name || "";
    checkoutEmail.value = currentUser.email || "";
}

// =======================
// RENDER CART
// =======================
function renderCart() {
    checkoutItems.innerHTML = "";
    let total = 0;

    if (!cart.length) {
        checkoutItems.innerHTML = `
            <li class="list-group-item text-center text-muted">Giỏ hàng trống</li>`;
        checkoutTotal.textContent = "0₫";
        return;
    }

    cart.forEach(item => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";

        li.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${item.img}" style="width:50px;height:50px;object-fit:cover" class="me-2 rounded">
                <span>${item.name} x${item.quantity}</span>
            </div>
            <span class="fw-bold text-primary">${(item.price * item.quantity).toLocaleString()}₫</span>
        `;

        checkoutItems.appendChild(li);
        total += item.price * item.quantity;
    });

    updateTotalDisplay(total);
}

// =======================
// VOUCHER HANDLING
// =======================
const vouchers = {
    "SILVER10": { type: "percent", value: 10 },
    "SILVER20": { type: "percent", value: 20 },
    "FREESHIP": { type: "minus", value: 30000 }
};

function applyVoucher() {
    const code = voucherInput.value.trim().toUpperCase();

    if (!code) return;

    if (!vouchers[code]) {
        voucherMsg.textContent = "❌ Mã không hợp lệ!";
        voucherMsg.style.color = "red";
        return;
    }

    if (appliedVoucher === code) {
        voucherMsg.textContent = "⚠ Mã này đã được áp dụng!";
        voucherMsg.style.color = "orange";
        return;
    }

    appliedVoucher = code;
    recalcVoucher();

    voucherMsg.textContent = `✔ Áp dụng mã ${code} thành công!`;
    voucherMsg.style.color = "green";
}

voucherBtn.addEventListener("click", applyVoucher);

function recalcVoucher() {
    const baseTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (!appliedVoucher) {
        discountAmount = 0;
        updateTotalDisplay(baseTotal);
        return;
    }

    const voucher = vouchers[appliedVoucher];

    if (voucher.type === "percent") {
        discountAmount = (baseTotal * voucher.value) / 100;
    } else if (voucher.type === "minus") {
        discountAmount = voucher.value;
    }

    updateTotalDisplay(baseTotal - discountAmount);
}

function updateTotalDisplay(finalTotal) {
    const baseTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Tổng gốc
    if (baseTotalEl) baseTotalEl.textContent = baseTotal.toLocaleString() + "₫";

    // Hiển thị giảm giá nếu có
    if (discountAmount > 0 && discountRow && discountEl) {
        discountRow.style.display = "flex";
        discountEl.textContent = discountAmount.toLocaleString() + "₫";
    } else if (discountRow) {
        discountRow.style.display = "none";
    }

    // Tổng cuối
    checkoutTotal.textContent = finalTotal.toLocaleString() + "₫";
}

// =======================
// VALIDATE
// =======================
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPhone = phone => /^[0-9]{9,11}$/.test(phone);

// =======================
// SUBMIT CHECKOUT
// =======================
function handleCheckout() {
    if (!checkoutForm) return;

    checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!cart.length) {
            alert("Giỏ hàng trống!");
            return;
        }

        const fullName = checkoutName.value.trim();
        const email = checkoutEmail.value.trim();
        const phone = checkoutPhone.value.trim();
        const address = checkoutAddress.value.trim();

        if (!fullName || !email || !phone || !address) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        if (!validEmail(email)) {
            alert("Email không hợp lệ!");
            return;
        }
        if (!validPhone(phone)) {
            alert("Số điện thoại không hợp lệ!");
            return;
        }

        // Sau khi tính baseTotal và finalTotal trong handleCheckout:

        const baseTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const finalTotal = baseTotal - discountAmount;

        // Cấp lượt quay dựa trên tổng gốc
        const spinsToAdd = Math.floor(baseTotal / 1000000);
        if (spinsToAdd > 0) {
            const turns = JSON.parse(localStorage.getItem("spinTurns")) || {};
            turns[email] = (turns[email] || 0) + spinsToAdd;
            localStorage.setItem("spinTurns", JSON.stringify(turns));
        }


        const orderItems = cart.map(item => ({ ...item }));

        const newOrder = {
            id: "ORD-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
            user: { fullName, email },
            phone,
            address,
            items: orderItems,
            total: finalTotal,
            voucher: appliedVoucher ?? null,
            discount: discountAmount,
            status: "Chờ xử lý",
            date: new Date().toISOString()
        };

        let orders = JSON.parse(localStorage.getItem("orders")) || [];
        orders.push(newOrder);
        localStorage.setItem("orders", JSON.stringify(orders));

        alert("Đặt hàng thành công!");

        localStorage.removeItem("cartData");
        window.location.href = "index.html";
    });
}

// =======================
// INIT
// =======================
renderCart();
handleCheckout();
