import { addProduct, createProductCard, deleteProduct, getChatSessionCount, loadProducts, markProductAsSold } from "./apiClient.js";

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
const analyticsModal = document.getElementById("analyticsModal");
const closeAnalyticsModalBtn = document.getElementById("closeAnalyticsModalBtn");
const analyticsModalProductId = document.getElementById("analyticsModalProductId");
const analyticsModalContent = document.getElementById("analyticsModalContent");

// Form Inputs
const nameInput = productForm.querySelector('input[placeholder="Wireless Mouse"]');
const priceInput = productForm.querySelector('input[placeholder="29.99"]');
const descriptionInput = productForm.querySelector("textarea");
const contactLinkInput = document.getElementById("productContactLink");
const submitButton = productForm.querySelector('button[type="submit"]');
const statusText = document.getElementById("productStatusText");
let lastFocusedElement = null;

// ==========================================================================
// MODAL CONTROLS
// ==========================================================================
function openModal() {
    lastFocusedElement = document.activeElement;
    productModal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
    nameInput.focus();
}

function closeModal() {
    productModal.classList.add("hidden");
    document.body.style.overflow = "";
    productForm.reset();
    statusText.textContent = "";
    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

function openAnalyticsModal(productId) {
    lastFocusedElement = document.activeElement;
    analyticsModalProductId.textContent = `Product ID: ${productId}`;
    analyticsModalContent.textContent = "";
    analyticsModalContent.classList.add("skeleton", "analytics-content-skeleton");
    analyticsModalContent.setAttribute("aria-busy", "true");
    analyticsModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    closeAnalyticsModalBtn.focus();
}

function setAnalyticsModalContent(content) {
    analyticsModalContent.classList.remove("skeleton", "analytics-content-skeleton");
    analyticsModalContent.setAttribute("aria-busy", "false");
    analyticsModalContent.textContent = content;
}

function closeAnalyticsModal() {
    analyticsModal.classList.add("hidden");
    if (productModal && productModal.classList.contains("hidden")) {
        document.body.style.overflow = "";
    }
    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

openModalBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
closeAnalyticsModalBtn.addEventListener("click", closeAnalyticsModal);

// Close modal when clicking on the backdrop
productModal.addEventListener("click", (e) => {
    if (e.target === productModal) {
        closeModal();
    }
});

// Close modal on Escape key press
document.addEventListener("keydown", (e) => {
    const activeModal = !productModal.classList.contains("hidden") ?
        productModal :
        !analyticsModal.classList.contains("hidden") ? analyticsModal : null;

    if (activeModal && e.key === "Tab") {
        const focusableElements = activeModal.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    if (e.key === "Escape") {
        if (!productModal.classList.contains("hidden")) {
            closeModal();
        } else if (!analyticsModal.classList.contains("hidden")) {
            closeAnalyticsModal();
        }
    }
});

// ==========================================================================
// SEARCH FILTERING
// ==========================================================================
searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll(".product-card:not(.product-card-skeleton)");
    let visibleCount = 0;

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
        if (matches) visibleCount += 1;
    });

    if (productGrid.getAttribute("aria-busy") !== "true") {
        listStatusText.textContent = query && cards.length > 0 && visibleCount === 0 ?
            "No products match your search." :
            cards.length === 0 ? "No products found." : "";
    }
});

// ==========================================================================
// CREATE NEW PRODUCT
// ==========================================================================
const CREATE_COOLDOWN_MS = 5000; // 5 seconds cooldown after creating a product
let lastCreateTime = 0;
let createCooldownInterval = null;
let isCreatingProduct = false;
let isCreateCoolingDown = false;

function isProductFormValid() {
    const contactLink = contactLinkInput.value.trim();
    let isContactLinkValid = false;

    try {
        const protocol = new URL(contactLink).protocol;
        isContactLinkValid = protocol === "http:" || protocol === "https:";
    } catch {
        // An invalid URL keeps the submit button disabled.
    }

    return Boolean(
        nameInput.value.trim() &&
        descriptionInput.value.trim() &&
        Number.isFinite(priceInput.valueAsNumber) &&
        priceInput.valueAsNumber > 0 &&
        contactLink &&
        isContactLinkValid &&
        productForm.checkValidity()
    );
}

function updateCreateButtonState() {
    submitButton.disabled =
        isCreatingProduct ||
        isCreateCoolingDown ||
        !isProductFormValid();
}

productForm.addEventListener("input", updateCreateButtonState);
productForm.addEventListener("reset", () => {
    setTimeout(updateCreateButtonState, 0);
});
updateCreateButtonState();

productForm.addEventListener("submit", async(e) => {
    e.preventDefault();

    if (submitButton.disabled || !isProductFormValid()) {
        updateCreateButtonState();
        return;
    }

    const title = nameInput.value.trim();
    const price = priceInput.valueAsNumber;
    const description = descriptionInput.value.trim();
    const contactLink = contactLinkInput.value.trim();

    const now = Date.now();
    if (now - lastCreateTime < CREATE_COOLDOWN_MS) {
        const wait = Math.ceil((CREATE_COOLDOWN_MS - (now - lastCreateTime)) / 1000);
        statusText.textContent = `Please wait ${wait}s before creating another product.`;
        return;
    }

    isCreatingProduct = true;
    updateCreateButtonState();
    statusText.textContent = "Adding product, please wait...";

    try {
        const createdProduct = await addProduct({
            title,
            description,
            price,
            contact_link: contactLink,
        });

        const newCard = createProductCard({...createdProduct, title: createdProduct.title || title, description: createdProduct.description || description, price: createdProduct.price || price, });

        productGrid.prepend(newCard);
        closeModal();
        productForm.reset();
        // start cooldown
        lastCreateTime = Date.now();
        let remaining = Math.ceil(CREATE_COOLDOWN_MS / 1000);
        isCreateCoolingDown = true;
        updateCreateButtonState();
        statusText.textContent = `Please wait ${remaining}s before creating another product.`;
        if (createCooldownInterval) clearInterval(createCooldownInterval);
        createCooldownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
                statusText.textContent = `Please wait ${remaining}s before creating another product.`;
            } else {
                clearInterval(createCooldownInterval);
                createCooldownInterval = null;
                isCreateCoolingDown = false;
                updateCreateButtonState();
                statusText.textContent = "";
            }
        }, 1000);
    } catch (error) {
        console.error("Failed to create product:", error);
        alert(error.message || "Unable to create product. Please try again.");
    } finally {
        // only re-enable immediately if there is no active cooldown
        if (!createCooldownInterval) {
            isCreatingProduct = false;
            updateCreateButtonState();
            statusText.textContent = "";
        } else {
            isCreatingProduct = false;
            updateCreateButtonState();
        }
    }
});

analyticsModal.addEventListener("click", (e) => {
    if (e.target === analyticsModal) {
        closeAnalyticsModal();
    }
});

loadProducts(productGrid, listStatusText);

// ==========================================================================
// CARD ACTIONS (OPEN / MARK AS SOLD / DELETE)
// ==========================================================================
productGrid.addEventListener("click", async(e) => {
    const viewCountButton = e.target.closest(".view-count-btn");
    const markSoldButton = e.target.closest(".mark-as-sold-btn");
    const openButton = e.target.closest(".open-btn");
    const deleteButton = e.target.closest(".danger-btn");

    if (viewCountButton) {
        const card = viewCountButton.closest(".product-card");
        const productId = card && card.dataset.productId;

        if (!productId) {
            alert("This product is missing its id, so it cannot be checked.");
            return;
        }

        openAnalyticsModal(productId);

        try {
            const payload = await getChatSessionCount(productId);
            setAnalyticsModalContent(JSON.stringify(payload, null, 2));
        } catch (error) {
            console.error("Failed to load chat session count:", error);
            setAnalyticsModalContent(error.message || "Unable to load chat session count.");
        }

        return;
    }

    if (markSoldButton) {
        const card = markSoldButton.closest(".product-card");
        const productId = card && card.dataset.productId;
        const currentStatus = card && card.dataset.productStatus;

        if (!productId) {
            alert("This product is missing its id, so it cannot be updated.");
            return;
        }

        if (markSoldButton.disabled || currentStatus === "sold") {
            return;
        }

        markSoldButton.disabled = true;
        const originalText = markSoldButton.textContent;
        markSoldButton.textContent = "Marking...";

        try {
            await markProductAsSold(productId);

            const statusLabel = card.querySelector(".product-status-label");
            if (statusLabel) {
                statusLabel.textContent = "Sold";
            }

            card.dataset.productStatus = "sold";
            markSoldButton.textContent = "Sold";
            markSoldButton.disabled = true;
        } catch (error) {
            console.error("Failed to mark product as sold:", error);
            alert(error.message || "Unable to mark product as sold. Please try again.");
            markSoldButton.disabled = false;
            markSoldButton.textContent = originalText;
        }

        return;
    }

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