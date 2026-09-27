// ==========================================
// 1. INISIALISASI & STATE GLOBAL
// ==========================================
const sessionName = localStorage.getItem("firstName");
if (!sessionName) window.location.replace("login.html");

const state = {
  products: [],
  filtered: [],
  visible: 8,
  cart: JSON.parse(localStorage.getItem("cart") || "[]"),
};

// ==========================================
// 2. HELPER UTILITIES
// ==========================================
const $ = (id) => document.getElementById(id);

const formatPrice = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// ==========================================
// 3. FUNGSI KERANJANG (CART)
// ==========================================
const saveCart = () => localStorage.setItem("cart", JSON.stringify(state.cart));

function updateCart() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  $("cartBadge").textContent = totalCount;
  $("cartTotal").textContent = formatPrice(totalPrice);

  $("cartItems").innerHTML = state.cart.length
    ? state.cart
        .map(
          (item) => `
          <div class="cart-item">
            <img src="${item.thumbnail}" alt="${item.title}">
            <div>
              <h3>${item.title}</h3>
              <p>${formatPrice(item.price)}</p>
            </div>
            <div class="quantity-control">
              <button data-cart-action="minus" data-id="${item.id}" type="button">−</button>
              <span>${item.quantity}</span>
              <button data-cart-action="plus" data-id="${item.id}" type="button">+</button>
            </div>
          </div>
        `
        )
        .join("")
    : '<p class="state">Keranjang masih kosong.</p>';
}

function addToCart(product) {
  const found = state.cart.find((item) => item.id === product.id);
  
  if (found) {
    found.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: product.price * 15000,
      thumbnail: product.thumbnail,
      quantity: 1,
    });
  }
  
  saveCart();
  updateCart();
}

// ==========================================
// 4. RENDER PRODUK & FILTER
// ==========================================
function render() {
  const items = state.filtered.slice(0, state.visible);

  $("productGrid").innerHTML = items
    .map(
      (product) => `
      <article class="product-card" data-product-id="${product.id}">
        <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <h2 class="product-title">${product.title}</h2>
          <div class="product-meta">
            <span>★ ${product.rating.toFixed(1)}</span>
            <span>${product.discountPercentage.toFixed(0)}% diskon</span>
          </div>
          <p class="price">${formatPrice(product.price * 15000)}</p>
          <button class="button button-primary add-button" data-action="add" type="button">Tambah ke keranjang</button>
        </div>
      </article>
    `
    )
    .join("");

  $("emptyState").classList.toggle("hidden", items.length > 0);
  $("resultCount").textContent = `${state.filtered.length} produk`;
  $("loadMoreButton").classList.toggle(
    "hidden",
    state.visible >= state.filtered.length || !state.filtered.length
  );
}

function applyFilters() {
  const query = $("searchInput").value.trim().toLowerCase();
  const category = $("categorySelect").value;
  const sort = $("sortSelect").value;

  state.filtered = state.products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      `${p.title} ${p.category}`.toLowerCase().includes(query)
  );

  if (sort === "price-asc") state.filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") state.filtered.sort((a, b) => b.price - a.price);
  if (sort === "rating-desc") state.filtered.sort((a, b) => b.rating - a.rating);

  state.visible = 8;
  render();
}

// ==========================================
// 5. MODAL DETAIL PRODUK
// ==========================================
function showModal(product) {
  $("modalContent").innerHTML = `
    <div class="modal-content">
      <img src="${product.images[0] || product.thumbnail}" alt="${product.title}">
      <div>
        <span class="product-category">${product.category}</span>
        <h2>${product.title}</h2>
        <p>${product.description}</p>
        <p><strong>Brand:</strong> ${product.brand || "-"}<br>
           <strong>Stok:</strong> ${product.stock}<br>
           <strong>Rating:</strong> ★ ${product.rating}</p>
        <p class="price">${formatPrice(product.price * 15000)}</p>
        <button class="button button-primary" data-action="add-modal" data-id="${product.id}" type="button">Tambah ke keranjang</button>
      </div>
    </div>
  `;
  $("productModal").showModal();
}

// ==========================================
// 6. FETCH DATA API
// ==========================================
async function loadProducts() {
  try {
    const response = await fetch("https://dummyjson.com/products?limit=0");
    if (!response.ok) throw new Error("API produk tidak dapat diakses.");

    const data = await response.json();
    state.products = data.products;

    // Masukkan kategori unik ke dalam dropdown select
    const categories = [...new Set(state.products.map((p) => p.category))].sort();
    categories.forEach((category) => {
      $("categorySelect").insertAdjacentHTML(
        "beforeend",
        `<option value="${category}">${category}</option>`
      );
    });

    applyFilters();
    $("loadingState").classList.add("hidden");
  } catch (error) {
    $("loadingState").classList.add("hidden");
    $("globalError").textContent = `Gagal memuat produk: ${error.message}`;
    $("globalError").classList.remove("hidden");
  }
}

// ==========================================
// 7. EVENT LISTENERS
// ==========================================
$("userName").textContent = sessionName || "Pengguna";

$("searchInput").addEventListener("input", debounce(applyFilters, 350));
$("categorySelect").addEventListener("change", applyFilters);
$("sortSelect").addEventListener("change", applyFilters);

$("loadMoreButton").addEventListener("click", () => {
  state.visible += 8;
  render();
});

$("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("firstName");
  localStorage.removeItem("cart");
  window.location.replace("login.html");
});

// Kontrol Drawer Keranjang
const closeCart = () => {
  $("cartPanel").classList.remove("open");
  $("overlay").classList.add("hidden");
};

$("cartButton").addEventListener("click", () => {
  $("cartPanel").classList.add("open");
  $("overlay").classList.remove("hidden");
});

$("closeCartButton").addEventListener("click", closeCart);
$("overlay").addEventListener("click", closeCart);
$("clearCartButton").addEventListener("click", () => {
  state.cart = [];
  saveCart();
  updateCart();
});

// Kontrol Modal
$("closeModalButton").addEventListener("click", () => $("productModal").close());

// Event Delegation untuk Grid Produk
$("productGrid").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const card = event.target.closest("[data-product-id]");
  const productId = Number(card?.dataset.productId);

  if (button?.dataset.action === "add") {
    addToCart(state.products.find((p) => p.id === productId));
  } else if (card) {
    showModal(state.products.find((p) => p.id === productId));
  }
});

// Event Delegation untuk Modal Content
$("modalContent").addEventListener("click", (event) => {
  if (event.target.dataset.action === "add-modal") {
    const productId = Number(event.target.dataset.id);
    addToCart(state.products.find((p) => p.id === productId));
  }
});

// Event Delegation untuk Item di Keranjang
$("cartItems").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const itemId = Number(button.dataset.id);
  const item = state.cart.find((i) => i.id === itemId);

  if (item) {
    if (button.dataset.cartAction === "plus") item.quantity += 1;
    else if (button.dataset.cartAction === "minus") item.quantity -= 1;
  }

  state.cart = state.cart.filter((i) => i.quantity > 0);
  saveCart();
  updateCart();
});

// ==========================================
// 8. INISIALISASI AWAL APLIKASI
// ==========================================
updateCart();
loadProducts();