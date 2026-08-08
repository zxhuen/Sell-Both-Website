import { addProduct, createProductCard, deleteProduct, loadProducts } from "./apiClient.js";

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
        const descEl = card.querySelector(".product-card-description") || card.querySelector("p");
        const description = descEl ? descEl.textContent.toLowerCase() : "";

        const matches =
            title.includes(query) ||
            category.includes(query) ||
            description.includes(query);

        // Preserve original card layout (grid) by clearing the display
        // when visible; set to 'none' when not matching.
        card.style.display = matches ? "" : "none";
    });
});

// ==========================================================================
// CREATE NEW PRODUCT
// ==========================================================================
const CREATE_COOLDOWN_MS = 5000; // 5 seconds cooldown after creating a product
let lastCreateTime = 0;
let createCooldownInterval = null;

productForm.addEventListener("submit", async(e) => {
    e.preventDefault();

    const title = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const description = descriptionInput.value.trim();

    if (!title || Number.isNaN(price)) {
        return;
    }

    const now = Date.now();
    if (now - lastCreateTime < CREATE_COOLDOWN_MS) {
        const wait = Math.ceil((CREATE_COOLDOWN_MS - (now - lastCreateTime)) / 1000);
        statusText.textContent = `Please wait ${wait}s before creating another product.`;
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

        const newCard = createProductCard({...createdProduct, title: createdProduct.title || title, description: createdProduct.description || description, price: createdProduct.price || price, });

        productGrid.prepend(newCard);
        closeModal();
        productForm.reset();
        // start cooldown
        lastCreateTime = Date.now();
        let remaining = Math.ceil(CREATE_COOLDOWN_MS / 1000);
        submitButton.disabled = true;
        statusText.textContent = `Please wait ${remaining}s before creating another product.`;
        if (createCooldownInterval) clearInterval(createCooldownInterval);
        createCooldownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
                statusText.textContent = `Please wait ${remaining}s before creating another product.`;
            } else {
                clearInterval(createCooldownInterval);
                createCooldownInterval = null;
                submitButton.disabled = false;
                statusText.textContent = "";
            }
        }, 1000);
    } catch (error) {
        console.error("Failed to create product:", error);
        alert(error.message || "Unable to create product. Please try again.");
    } finally {
        // only re-enable immediately if there is no active cooldown
        if (!createCooldownInterval) {
            submitButton.disabled = false;
            statusText.textContent = "";
        }
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