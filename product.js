document.addEventListener("DOMContentLoaded", () => {
    // ===== DỮ LIỆU SẢN PHẨM =====
    let products = JSON.parse(localStorage.getItem("products")) || [
        { name: "Nhẫn bạc", type: "Nhẫn", img: "https://tse4.mm.bing.net/th/id/OIP.LMR_n7J5JM-mL_Z-Fn8jEwHaEJ?pid=Api&h=220&P=0", price: 350000, desc: "Thiết kế tinh tế, sang trọng, phù hợp mọi phong cách." },
        { name: "Dây chuyền bạc", type: "Dây chuyền", img: "https://img.freepik.com/free-photo/side-view-silver-bracelets-with-diamonds-black-wall_140725-12838.jpg", price: 590000, desc: "Chất liệu bạc S925 cao cấp, không đen, không dị ứng." },
        { name: "Vòng tay bạc", type: "Vòng tay", img: "http://www.fashionlady.in/wp-content/uploads/2016/11/Sterling-Silver-Jewelry.jpg", price: 480000, desc: "Phong cách trẻ trung, dễ phối đồ, món quà ý nghĩa." }
    ];

    let filteredProducts = [...products];
    let cart = JSON.parse(localStorage.getItem("cartData")) || [];
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // ===== ELEMENTS =====
    const productGrid = document.getElementById("product-grid");
    const searchInput = document.getElementById("search-input");
    const sortSelect = document.getElementById("sort-select");
    const categoryFilter = document.getElementById("category-filter");
    const cartCount = document.getElementById("cart-count");
    const cartSidebar = document.getElementById("cart-sidebar");
    const cartItemsEl = document.getElementById("cart-items");
    const cartTotalEl = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn");
    const cartToggle = document.getElementById("cart-toggle");
    const cartClose = document.getElementById("cart-close");
    const adminAddContainer = document.getElementById("admin-add-product-container");
    const addProductModalEl = document.getElementById("addProductModal");

    // ===== RENDER SẢN PHẨM =====
    const renderProducts = (list) => {
        productGrid.innerHTML = "";
        if (!list.length) return productGrid.innerHTML = `<p class="text-center fw-bold">Không có sản phẩm nào.</p>`;

        list.forEach((product, index) => {
            const col = document.createElement("div");
            col.className = "col-md-4 col-sm-6 mb-4";
            col.innerHTML = `
                <div class="card h-100 text-center shadow-sm">
                    <img src="${product.img}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-muted">${product.desc}</p>
                        <p class="fw-bold text-primary">${product.price.toLocaleString()}₫</p>
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-outline-primary btn-add-cart"><i class="fas fa-cart-plus"></i> Thêm vào giỏ</button>
                        </div>
                    </div>
                </div>
            `;

            // Nút thêm vào giỏ
            col.querySelector(".btn-add-cart").addEventListener("click", () => addToCart(product));

            // Admin: Sửa/Xóa sản phẩm
            if (currentUser?.role === "admin") {
                const adminDiv = document.createElement("div");
                adminDiv.className = "mt-2 d-flex justify-content-center gap-2";
                const btnEdit = document.createElement("button");
                btnEdit.className = "btn btn-sm btn-warning"; btnEdit.textContent = "Sửa";
                btnEdit.addEventListener("click", () => editProduct(index));
                const btnDelete = document.createElement("button");
                btnDelete.className = "btn btn-sm btn-danger"; btnDelete.textContent = "Xóa";
                btnDelete.addEventListener("click", () => deleteProduct(index));
                adminDiv.append(btnEdit, btnDelete);
                col.querySelector(".card-body").appendChild(adminDiv);
            }

            productGrid.appendChild(col);
        });
    };

    // ===== RENDER DANH MỤC =====
    const renderCategories = () => {
        const categories = {};
        products.forEach(p => categories[p.type] = (categories[p.type] || 0) + 1);
        categoryFilter.innerHTML = `<li class="list-group-item active" data-type="">Tất cả (${products.length})</li>`;
        Object.entries(categories).forEach(([type, count]) => {
            categoryFilter.innerHTML += `<li class="list-group-item" data-type="${type}">${type} (${count})</li>`;
        });
        categoryFilter.querySelectorAll("li").forEach(item => {
            item.addEventListener("click", () => {
                categoryFilter.querySelectorAll("li").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                filterProducts(searchInput.value, item.dataset.type);
            });
        });
    };

    // ===== FILTER SẢN PHẨM =====
    const filterProducts = (searchTerm = "", category = "") => {
        searchTerm = searchTerm.toLowerCase();
        filteredProducts = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm) && (category === "" || p.type === category)
        );
        renderProducts(filteredProducts);
    };

    searchInput.addEventListener("input", () => {
        const activeCat = categoryFilter.querySelector(".active")?.dataset.type || "";
        filterProducts(searchInput.value, activeCat);
    });

    sortSelect.addEventListener("change", () => {
        const sorted = [...filteredProducts];
        if (sortSelect.value === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortSelect.value === "name-desc") sorted.sort((a, b) => b.name.localeCompare(a.name));
        else if (sortSelect.value === "price-asc") sorted.sort((a, b) => a.price - b.price);
        else if (sortSelect.value === "price-desc") sorted.sort((a, b) => b.price - a.price);
        renderProducts(sorted);
    });

    // ===== GIỎ HÀNG =====
    const addToCart = (product) => {
        const item = cart.find(p => p.name === product.name);
        item ? item.quantity++ : cart.push({ ...product, quantity: 1 });
        localStorage.setItem("cartData", JSON.stringify(cart));
        updateCartUI(); openCart();
    };

    const changeQuantity = (index, qty) => {
        if (qty <= 0) cart.splice(index, 1);
        else cart[index].quantity = qty;
        localStorage.setItem("cartData", JSON.stringify(cart));
        updateCartUI();
    };

    const updateCartUI = () => {
        cartItemsEl.innerHTML = "";
        if (!cart.length) {
            cartItemsEl.innerHTML = `<li class="text-center text-muted">Giỏ hàng trống</li>`;
            cartTotalEl.textContent = "0₫"; cartCount.textContent = "0"; return;
        }
        let total = 0;
        cart.forEach((p, i) => {
            total += p.price * p.quantity;
            const li = document.createElement("li");
            li.className = "d-flex justify-content-between align-items-center mb-2";
            li.innerHTML = `
                <div>
                    <strong>${p.name}</strong> x${p.quantity}<br>
                    <span class="text-primary">${(p.price * p.quantity).toLocaleString()}₫</span>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary minus">−</button>
                    <input type="number" min="1" value="${p.quantity}" class="form-control form-control-sm mx-1 text-center" style="width:50px;">
                    <button class="btn btn-sm btn-outline-secondary plus">+</button>
                </div>
            `;
            li.querySelector(".minus").addEventListener("click", () => changeQuantity(i, p.quantity - 1));
            li.querySelector(".plus").addEventListener("click", () => changeQuantity(i, p.quantity + 1));
            li.querySelector("input").addEventListener("change", e => changeQuantity(i, parseInt(e.target.value) || 1));
            cartItemsEl.appendChild(li);
        });
        cartTotalEl.textContent = total.toLocaleString() + "₫";
        cartCount.textContent = cart.reduce((sum, p) => sum + p.quantity, 0);
    };

    const openCart = () => cartSidebar.classList.add("show");
    const closeCart = () => cartSidebar.classList.remove("show");
    cartToggle.addEventListener("click", e => { e.preventDefault(); openCart(); });
    cartClose.addEventListener("click", closeCart);
    checkoutBtn.addEventListener("click", () => {
        localStorage.setItem("cartData", JSON.stringify(cart));
        window.location.href = "checkout.html";
    });

    // ===== ADMIN =====
    if (currentUser?.role === "admin") {
        adminAddContainer.style.display = "block";
        const addBtn = document.getElementById("add-product-btn");
        const addProductModal = new bootstrap.Modal(addProductModalEl);
        addBtn.addEventListener("click", () => addProductModal.show());

        const addForm = document.getElementById("add-product-form");
        addForm.addEventListener("submit", e => {
            e.preventDefault();
            const name = document.getElementById("product-name").value.trim();
            const price = parseInt(document.getElementById("product-price").value);
            const type = document.getElementById("product-type").value.trim();
            const img = document.getElementById("product-img").value.trim();
            const desc = document.getElementById("product-desc").value.trim();
            if (!name || !price || !type || !img || !desc) return alert("Vui lòng nhập đầy đủ thông tin!");
            products.push({ name, price, type, img, desc });
            localStorage.setItem("products", JSON.stringify(products));
            addForm.reset(); addProductModal.hide();
            renderCategories(); renderProducts(products);
        });
    }

    const saveProducts = () => localStorage.setItem("products", JSON.stringify(products));

    const editProduct = index => {
        const p = products[index];
        const name = prompt("Tên sản phẩm:", p.name);
        if (!name) return;
        const price = parseInt(prompt("Giá sản phẩm:", p.price));
        if (isNaN(price)) return;
        const type = prompt("Loại sản phẩm:", p.type);
        if (!type) return;
        const desc = prompt("Mô tả:", p.desc);
        if (!desc) return;
        const img = prompt("URL ảnh:", p.img);
        if (!img) return;
        products[index] = { name, price, type, desc, img };
        saveProducts(); renderCategories(); renderProducts(filteredProducts);
    };

    const deleteProduct = index => {
        if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
        products.splice(index, 1);
        saveProducts(); renderCategories(); renderProducts(filteredProducts);
    };

    // ===== INIT =====
    renderProducts(products);
    renderCategories();
    updateCartUI();
});
