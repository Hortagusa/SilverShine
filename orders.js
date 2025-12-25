document.addEventListener("DOMContentLoaded", () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || currentUser.role !== "admin") {
        alert("Chỉ admin mới được xem đơn hàng!");
        window.location.href = "index.html";
        return;
    }

    const ordersContainer = document.getElementById("orders-container");
    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    const statusColors = {
        "Chờ xử lý": "bg-warning text-dark",
        "Đang giao": "bg-primary text-white",
        "Hoàn thành": "bg-success text-white",
    };

    // --- Chart references ---
    let revenueChart, statusChart, productsChart;

    // --- Hàm render bảng ---
    const renderOrders = (filtered = orders) => {
        ordersContainer.innerHTML = "";
        if (filtered.length === 0) {
            ordersContainer.innerHTML = "<p>Không có đơn hàng nào phù hợp.</p>";
            return;
        }

        const table = document.createElement("table");
        table.className = "table table-hover align-middle";
        table.innerHTML = `
            <thead class="table-light">
                <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Email</th>
                    <th>Tổng tiền</th>
                    <th>Ngày đặt</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector("tbody");

        filtered.forEach(order => {
            const statusClass = statusColors[order.status] || "bg-secondary text-white";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${order.id}</td>
                <td>${order.user?.name || "Không rõ"}</td>
                <td>${order.user?.email || "N/A"}</td>
                <td>${order.total?.toLocaleString() || 0}₫</td>
                <td>${order.date ? new Date(order.date).toLocaleDateString("vi-VN") : "N/A"}</td>
                <td><span class="badge ${statusClass}">${order.status || "Chờ xử lý"}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-btn" data-id="${order.id}">Xem</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${order.id}">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        ordersContainer.appendChild(table);

        // --- Xử lý nút xem ---
        document.querySelectorAll(".view-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = e.target.dataset.id;
                const order = orders.find(o => o.id === id);
                if (order) showOrderDetails(order);
            });
        });

        // --- Xử lý nút xóa ---
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = e.target.dataset.id;
                if (confirm("Xóa đơn hàng này?")) {
                    orders = orders.filter(o => o.id !== id);
                    localStorage.setItem("orders", JSON.stringify(orders));
                    updateOrders();
                }
            });
        });
    };

    // --- Modal xem chi tiết ---
    const showOrderDetails = (order) => {
        const itemsHtml = order.items.map(it => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${it.name} x${it.quantity}
                <span>${(it.price * it.quantity).toLocaleString()}₫</span>
            </li>
        `).join("");

        const modal = document.createElement("div");
        modal.className = "modal fade show";
        modal.style.display = "block";
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi tiết đơn hàng ${order.id}</h5>
                        <button type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Khách hàng:</strong> ${order.user?.name || "Không rõ"}</p>
                        <p><strong>Email:</strong> ${order.user?.email || "N/A"}</p>
                        <p><strong>Địa chỉ:</strong> ${order.address || "N/A"}</p>
                        <p><strong>Điện thoại:</strong> ${order.phone || "N/A"}</p>
                        <p><strong>Ngày đặt:</strong> ${order.date ? new Date(order.date).toLocaleString() : "N/A"}</p>
                        <ul class="list-group mb-3">${itemsHtml}</ul>
                        <p><strong>Tổng tiền:</strong> ${order.total.toLocaleString()}₫</p>
                        <div>
                            <label class="form-label">Trạng thái:</label>
                            <select class="form-select status-select">
                                <option ${order.status === "Chờ xử lý" ? "selected" : ""}>Chờ xử lý</option>
                                <option ${order.status === "Đang giao" ? "selected" : ""}>Đang giao</option>
                                <option ${order.status === "Hoàn thành" ? "selected" : ""}>Hoàn thành</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary save-btn">Lưu</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector(".btn-close");
        const saveBtn = modal.querySelector(".save-btn");
        const statusSelect = modal.querySelector(".status-select");

        closeBtn.onclick = () => modal.remove();
        saveBtn.onclick = () => {
            order.status = statusSelect.value;
            localStorage.setItem("orders", JSON.stringify(orders));
            modal.remove();
            updateOrders();
        };
    };

    // --- Hàm render chart ---
    function renderCharts(orders) {
        if (revenueChart) revenueChart.destroy();
        if (statusChart) statusChart.destroy();
        if (productsChart) productsChart.destroy();

        // Doanh thu theo tháng
        const revenueByMonth = Array(12).fill(0);
        orders.forEach(o => { const d = new Date(o.date); revenueByMonth[d.getMonth()] += o.total; });
        revenueChart = new Chart(document.getElementById("chartRevenue"), {
            type: "bar",
            data: {
                labels: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
                datasets: [{ label: "Doanh thu (VNĐ)", data: revenueByMonth, backgroundColor: "#0D6EFD" }]
            }
        });

        // Trạng thái đơn hàng
        const statusCount = { "Chờ xử lý": 0, "Đang giao": 0, "Hoàn thành": 0 };
        orders.forEach(o => statusCount[o.status] = (statusCount[o.status] || 0) + 1);
        statusChart = new Chart(document.getElementById("chartStatus"), {
            type: "pie",
            data: { labels: Object.keys(statusCount), datasets: [{ data: Object.values(statusCount), backgroundColor: ["#FFC107", "#0D6EFD", "#198754"] }] }
        });

        // Sản phẩm bán chạy
        const productCount = {};
        orders.forEach(o => o.items.forEach(it => productCount[it.name] = (productCount[it.name] || 0) + it.quantity));
        productsChart = new Chart(document.getElementById("chartProducts"), {
            type: "bar",
            data: { labels: Object.keys(productCount), datasets: [{ label: "Số lượng bán", data: Object.values(productCount), backgroundColor: "#0D6EFD" }] },
            options: { indexAxis: "y" }
        });
    }

    const updateOrders = (filtered = null) => {
        renderOrders(filtered || orders);
        renderCharts(filtered || orders);
    };

    // --- Bộ lọc ---
    const searchInput = document.getElementById("searchEmail");
    const statusFilter = document.getElementById("filterStatus");
    const sortSelect = document.getElementById("sortOption");
    const clearBtn = document.getElementById("clearFilters");

    const applyFilters = () => {
        let filtered = [...orders];
        const query = searchInput.value.trim().toLowerCase();
        if (query) filtered = filtered.filter(o => o.user?.email.toLowerCase().includes(query));
        const st = statusFilter.value;
        if (st) filtered = filtered.filter(o => o.status === st);

        switch (sortSelect.value) {
            case "name-asc": filtered.sort((a, b) => (a.user?.name || "").localeCompare(b.user?.name || "")); break;
            case "total-asc": filtered.sort((a, b) => a.total - b.total); break;
            case "total-desc": filtered.sort((a, b) => b.total - a.total); break;
            case "date-new": filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
            case "date-old": filtered.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
        }
        updateOrders(filtered);
    };

    [searchInput, statusFilter, sortSelect].forEach(el => el.addEventListener("input", applyFilters));
    clearBtn.addEventListener("click", () => {
        searchInput.value = ""; statusFilter.value = ""; sortSelect.value = "";
        updateOrders();
    });

    updateOrders();

    // --- Seed orders để test ---
    document.getElementById("seedOrdersBtn").addEventListener("click", () => {
        const count = parseInt(prompt("Tạo bao nhiêu đơn hàng test?", "10")) || 0;
        if (count <= 0) return;

        const products = JSON.parse(localStorage.getItem('products')) || [
            { name: "Nhẫn bạc", price: 350000, img: "", desc: "", type: "Nhẫn" },
            { name: "Dây chuyền bạc", price: 590000, img: "", desc: "", type: "Dây chuyền" },
            { name: "Vòng tay bạc", price: 480000, img: "", desc: "", type: "Vòng tay" },
            { name: "Mặt dây chuyền thánh giá", price: 349000, img: "", desc: "", type: "Mặt dây chuyền" },
            { name: "Nhẫn đôi bạc khắc tên", price: 670000, img: "", desc: "", type: "Nhẫn đôi" },
            { name: "Lắc chân bạc nữ", price: 420000, img: "", desc: "", type: "Lắc chân" },
            { name: "Bông tai bạc tròn nhỏ", price: 310000, img: "", desc: "", type: "Bông tai" },
            { name: "Dây chuyền bạc nam bản to", price: 750000, img: "", desc: "", type: "Dây chuyền" },
            { name: "Nhẫn bạc đính đá CZ", price: 520000, img: "", desc: "", type: "Nhẫn" },
            { name: "Vòng tay bạc khắc chữ", price: 560000, img: "", desc: "", type: "Vòng tay" },
            { name: "Mặt dây chuyền hình trái tim", price: 390000, img: "", desc: "", type: "Mặt dây chuyền" },
            { name: "Bông tai bạc giọt nước", price: 450000, img: "", desc: "", type: "Bông tai" },
            { name: "Lắc Chân Bạc Nữ Đính Đá CZ Hình Cỏ 4 Lá", price: 899000, img: "", desc: "", type: "Lắc chân" }
        ];

        const names = ["Châu", "Đức", "Huy", "Lộc", "Khang", "Nhựt", "Hoàng", "Khiêm", "Khôi", "Quang", "Thành"];
        const emails = ["chau@gmail.com", "duc@gmail.com", "huy@gmail.com", "loc@gmail.com", "khang@gmail.com", "nhut@gmail.com", "hoang@gmail.com", "khiem@gmail.com", "khoi@gmail.com", "quang@gmail.com", "thanh@gmail.com"];
        const addresses = ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Nha Trang"];
        const phones = ["0901234567", "0912345678", "0987654321", "0391234567", "0359876543"];
        const statuses = ["Chờ xử lý", "Đang giao", "Hoàn thành"];

        const newOrders = [];
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * names.length);
            const user = { name: names[idx], email: emails[idx] };
            const itemCount = Math.floor(Math.random() * 3) + 1;
            const items = [];
            let total = 0;
            for (let j = 0; j < itemCount; j++) {
                const p = products[Math.floor(Math.random() * products.length)];
                const qty = Math.floor(Math.random() * 3) + 1;
                items.push({ name: p.name, price: p.price, quantity: qty });
                total += p.price * qty;
            }
            const order = {
                id: "ORD" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
                user,
                items,
                address: addresses[Math.floor(Math.random() * addresses.length)],
                phone: phones[Math.floor(Math.random() * phones.length)],
                total,
                date: new Date(Date.now() - Math.floor(Math.random() * 365) * 86400000).toISOString(),
                status: statuses[Math.floor(Math.random() * statuses.length)]
            };
            newOrders.push(order);
        }
        orders.push(...newOrders);
        localStorage.setItem("orders", JSON.stringify(orders));
        alert(`${count} đơn hàng test đã được tạo!`);
        updateOrders();
    });
});
