document.addEventListener('DOMContentLoaded', () => {
    // Lấy thông tin user từ localStorage
    const user = JSON.parse(localStorage.getItem('currentUser')) || { name: '', email: '' };
    document.getElementById('username').textContent = user.name || 'Chưa đăng nhập';
    document.getElementById('email').textContent = user.email || 'Chưa có email';

    // Lấy tất cả orders từ localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    // Lọc đơn hàng chỉ của user hiện tại
    const userOrders = orders.filter(order => order.user && order.user.email === user.email);

    // Tính tổng chi tiêu an toàn, fallback nếu totalPrice undefined
    const totalSpent = userOrders.reduce((sum, order) => {
        const orderTotal = order.totalPrice || (order.items || []).reduce((s, item) => {
            const price = item.price || 0;
            const qty = item.quantity || 0;
            return s + price * qty;
        }, 0);
        return sum + orderTotal;
    }, 0);

    // Hiển thị tổng chi tiêu
    document.getElementById('total-spent').innerHTML = `<strong>${totalSpent.toLocaleString()}₫</strong>`;

    // Xác định rank và badge màu
    let rank = '';
    let rankClass = '';
    if (totalSpent >= 10000000) {
        rank = 'Platinum';
        rankClass = 'bg-primary';
    } else if (totalSpent >= 5000000) {
        rank = 'Gold';
        rankClass = 'bg-warning text-dark';
    } else if (totalSpent >= 1000000) {
        rank = 'Silver';
        rankClass = 'bg-secondary';
    } else {
        rank = 'Bronze';
        rankClass = 'bg-dark';
    }
    document.getElementById('rank').innerHTML = `<span class="badge ${rankClass} p-2">${rank}</span>`;

    // Hiển thị danh sách đơn hàng
    const tableBody = document.querySelector('#orders-table tbody');
    tableBody.innerHTML = '';

    if (userOrders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="text-center">Chưa có đơn hàng</td>`;
        tableBody.appendChild(row);
    } else {
        userOrders.forEach(order => {
            const items = order.items || [];
            items.forEach(item => {
                const name = item.name || 'N/A';
                const quantity = item.quantity || 0;
                const price = item.price || 0;
                const total = quantity * price;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</td>
                    <td>${name}</td>
                    <td>${quantity}</td>
                    <td>${price.toLocaleString()}₫</td>
                    <td>${total.toLocaleString()}₫</td>
                `;
                tableBody.appendChild(row);
            });

            // Tổng tiền từng đơn
            const orderTotal = order.totalPrice || items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
            const totalRow = document.createElement('tr');
            totalRow.innerHTML = `
                <td colspan="4" class="text-end fw-bold">Tổng đơn hàng:</td>
                <td class="fw-bold">${orderTotal.toLocaleString()}₫</td>
            `;
            totalRow.classList.add('table-info'); // highlight tổng đơn hàng
            tableBody.appendChild(totalRow);
        });
    }
});
