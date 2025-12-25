document.addEventListener("DOMContentLoaded", () => {
    const navbarAccount = document.getElementById("account-nav");

    // =======================
    // Khởi tạo users nếu chưa có
    // =======================
    if (!localStorage.getItem("users")) {
        const defaultUsers = [
            { name: "Admin", email: "admin@silvershine.vn", password: "admin123", role: "admin" },
            { name: "User", email: "user@silvershine.vn", password: "user123", role: "user" }
        ];
        localStorage.setItem("users", JSON.stringify(defaultUsers));
    }

    let users = JSON.parse(localStorage.getItem("users"));

    // =======================
    // Kiểm tra định dạng email
    // =======================
    const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // =======================
    // Render account navbar
    // =======================
    const renderAccount = () => {
        if (!navbarAccount) return;

        const currentUser = JSON.parse(localStorage.getItem("currentUser"));

        if (currentUser) {
            // Nếu là admin, thêm link quản lý
            let adminLinks = "";
            if (currentUser.role === "admin") {
                adminLinks = `
                    <li><a class="dropdown-item" href="orders.html">Đơn hàng</a></li>
                `;
            }

            navbarAccount.innerHTML = `
                <div class="dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="accountDropdown" role="button" data-bs-toggle="dropdown">
                        ${currentUser.role === "admin" ? "Admin" : currentUser.name}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
                        ${adminLinks}
                        <li><a class="dropdown-item" href="profile.html">Thông tin tài khoản</a></li>
                        <li><a class="dropdown-item" href="myvoucher.html">Voucher của tôi</a></li>
                        <li><a class="dropdown-item" href="checkout.html">Giỏ hàng</a></li>
                        <li><a class="dropdown-item" href="#" id="logout-btn">Đăng xuất</a></li>
                    </ul>
                </div>
            `;

            document.getElementById("logout-btn").addEventListener("click", () => {
                localStorage.removeItem("currentUser");
                renderAccount();
            });

        } else {
            // Chưa login
            navbarAccount.innerHTML = `<a class="nav-link btn btn-outline-primary" href="login.html">Đăng nhập</a>`;
        }
    };

    renderAccount();

    // =======================
    // Login form
    // =======================
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", e => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                alert("Vui lòng nhập đầy đủ thông tin!");
                return;
            }

            if (!validateEmail(email)) {
                alert("Email không hợp lệ!");
                return;
            }

            const user = users.find(u => u.email === email && u.password === password);
            if (!user) {
                alert("Email hoặc mật khẩu không đúng!");
                return;
            }

            localStorage.setItem("currentUser", JSON.stringify(user));
            alert("Đăng nhập thành công!");
            renderAccount(); // cập nhật navbar ngay lập tức

            window.location.href = "index.html"; // chuyển hướng sau login
        });
    }

    // =======================
    // Register form
    // =======================
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", e => {
            e.preventDefault();

            const name = document.getElementById("reg-name").value.trim();
            const email = document.getElementById("reg-email").value.trim();
            const password = document.getElementById("reg-password").value.trim();
            const confirm = document.getElementById("reg-confirm").value.trim();

            if (!name || !email || !password || !confirm) {
                alert("Vui lòng nhập đầy đủ thông tin!");
                return;
            }

            if (!validateEmail(email)) {
                alert("Email không hợp lệ!");
                return;
            }

            if (password !== confirm) {
                alert("Mật khẩu xác nhận không khớp!");
                return;
            }

            if (users.find(u => u.email === email)) {
                alert("Email đã tồn tại!");
                return;
            }

            const newUser = { name, email, password, role: "user" };
            users.push(newUser);
            localStorage.setItem("users", JSON.stringify(users));
            localStorage.setItem("currentUser", JSON.stringify(newUser));

            alert("Đăng ký thành công!");
            renderAccount();
            window.location.href = "index.html";
        });
    }
});
