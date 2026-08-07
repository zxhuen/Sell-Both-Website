import { addProduct, deleteProduct, loadProducts } from "./apiClient.js";

// ==========================================================================
// DOM ELEMENTS
// ==========================================================================
const productModal = document.getElementById("productModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const productForm = document.querySelector(".product-form");
const productGrid = document.querySelector(".product-grid");
const searchInput = document.querySelector(".search-input");
const listStatusText = document.getElementById("listStatusText");

// Form Inputs
const nameInput = productForm.querySelector('input[placeholder="Wireless Mouse"]');
const priceInput = productForm.querySelector('input[placeholder="29.99"]');
const descriptionInput = productForm.querySelector("textarea");
const submitButton = productForm.querySelector('button[type="submit"]');
const statusText = document.getElementById("productStatusText");

// ==========================================================================
// MODAL CONTROLS
// ==========================================================================
function openModal() {
    productModal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
    nameInput.focus();
}

function closeModal() {
    productModal.classList.add("hidden");
    document.body.style.overflow = "";
    productForm.reset();
}

openModalBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);

// Close modal when clicking on the backdrop
productModal.addEventListener("click", (e) => {
    if (e.target === productModal) {
        closeModal();
    }
});

// Close modal on Escape key press
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !productModal.classList.contains("hidden")) {
        closeModal();
    }
});

// ==========================================================================
// SEARCH FILTERING
// ==========================================================================
searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll(".product-card");

    cards.forEach((card) => {
        const title = card.querySelector("h2").textContent.toLowerCase();
        const categoryEl = card.querySelector(".category");
        const category = categoryEl ? categoryEl.textContent.toLowerCase() : "";
        const description = card.querySelector("p").textContent.toLowerCase();

        const matches =
            title.includes(query) ||
            category.includes(query) ||
            description.includes(query);

        card.style.display = matches ? "flex" : "none";
    });
});

// ==========================================================================
// CREATE NEW PRODUCT
// ==========================================================================
productForm.addEventListener("submit", async(e) => {
    e.preventDefault();

    const title = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const description = descriptionInput.value.trim();

    if (!title || Number.isNaN(price)) {
        return;
    }

    submitButton.disabled = true;
    statusText.textContent = "Adding product, please wait...";

    try {
        const createdProduct = await addProduct({
            title,
            description,
            price,
        });

        const newCard = document.createElement("div");
        newCard.classList.add("product-card");
        newCard.dataset.productId = createdProduct.id || "";
        newCard.dataset.publicId = createdProduct.public_id || "";

        newCard.innerHTML = `
        <div class="product-content">
          <h2>${createdProduct.title}</h2>
          <p>${createdProduct.description || description || "No description provided."}</p>
          <p class="product-public-id">Public ID: ${createdProduct.public_id || "N/A"}</p>
        </div>
        <div class="product-meta">
          <span class="price">$${parseFloat(createdProduct.price).toFixed(2)}</span>
          <div class="actions">
            <button class="secondary-btn">Open</button>
            <button class="danger-btn">Delete</button>
          </div>
        </div>
      `;

        productGrid.prepend(newCard);
        closeModal();
        productForm.reset();
    } catch (error) {
        console.error("Failed to create product:", error);
        alert(error.message || "Unable to create product. Please try again.");
    } finally {
        submitButton.disabled = false;
        statusText.textContent = "";
    }
});

loadProducts(productGrid, listStatusText);

// ==========================================================================
// CARD ACTIONS (OPEN & DELETE)
// ==========================================================================
productGrid.addEventListener("click", async(e) => {
    const openButton = e.target.closest(".secondary-btn");
    const deleteButton = e.target.closest(".danger-btn");

    if (openButton) {
        const card = openButton.closest(".product-card");
        const publicId = card && card.dataset.publicId;
        const destination = publicId ?
            `product.html?public_id=${encodeURIComponent(publicId)}` :
            "product.html";
        window.location.href = destination;
        return;
    }

    if (!deleteButton) {
        return;
    }

    const card = deleteButton.closest(".product-card");
    const productId = card && card.dataset.productId;

    if (!productId) {
        alert("This product is missing its id, so it cannot be deleted.");
        return;
    }

    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";

    try {
        await deleteProduct(productId);

        card.style.transition = "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";

        setTimeout(() => {
            card.remove();
        }, 250);
    } catch (error) {
        console.error("Failed to delete product:", error);
        alert(error.message || "Unable to delete product. Please try again.");
        deleteButton.disabled = false;
        deleteButton.textContent = "Delete";
    }
});