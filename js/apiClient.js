import { supabaseClient } from "./supabase.js";

const API_BASE = window.API_ENDPOINT || "https://sellbot-api.onrender.com";

// Helper function to escape HTML string input safely
function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export async function authFetch(url, options = {}) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
        return null;
    }

    const response = await fetch(url, {
        ...options,
        credentials: options.credentials !== undefined && options.credentials !== null ?
            options.credentials : "include",
        headers: {
            ...options.headers,
            Authorization: `Bearer ${session.access_token}`,
        },
    });

    if (response.status === 401) {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
        return null;
    }

    return response;
}

export async function publicFetch(url, options = {}) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession();

    const headers = {
        ...options.headers,
    };

    if (session) {
        headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url, {
        ...options,
        credentials: options.credentials !== undefined && options.credentials !== null ?
            options.credentials : "include",
        headers,
    });

    if (response.status === 401) {
        try {
            await supabaseClient.auth.signOut();
        } catch (err) {
            // ignore sign out errors
        }
        window.location.href = "login.html";
        return null;
    }

    return response;
}

export async function addProduct(product) {
    const response = await authFetch(`${API_BASE}/Products/add-product`, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
    });

    const statusText = response ? response.statusText : undefined;

    if (!response || !response.ok) {
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to create product"
        );
    }

    return response.json();
}

export async function deleteProduct(productId) {
    if (!productId) {
        throw new Error("Product id is required");
    }

    const response = await authFetch(`${API_BASE}/Products/delete-product?id=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        mode: "cors",
    });

    const statusText = response ? response.statusText : undefined;

    if (!response || !response.ok) {
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to delete product"
        );
    }

    return response.json();
}

export async function markProductAsSold(productId) {
    if (!productId) {
        throw new Error("Product id is required");
    }

    const response = await authFetch(`${API_BASE}/Products/mark-as-sold?id=${encodeURIComponent(productId)}`, {
        method: "PATCH",
        mode: "cors",
    });

    const statusText = response ? response.statusText : undefined;

    if (!response || !response.ok) {
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to mark product as sold"
        );
    }

    return response.json();
}

export async function getUserProfile() {
    const response = await authFetch(`${API_BASE}/User/show-profile`, {
        method: "GET",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response) return null;

    const statusText = response.statusText;

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to load user profile"
        );
    }

    return response.json();
}

export async function getProductByPublicId(publicId) {
    if (!publicId) {
        throw new Error("Public id is required");
    }

    const response = await publicFetch(`${API_BASE}/Products/get-product-public-id?public_id=${encodeURIComponent(publicId)}`, {
        method: "GET",
        mode: "cors",
    });

    const statusText = response ? response.statusText : undefined;

    if (!response || !response.ok) {
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to load product details"
        );
    }

    return response.json();
}

export async function getChatSessionCount(productId) {
    if (!productId) {
        throw new Error("Product id is required");
    }

    const response = await authFetch(`${API_BASE}/Analytics/get-chat-session-count?product_id=${encodeURIComponent(productId)}`, {
        method: "POST",
        mode: "cors",
    });

    const statusText = response ? response.statusText : undefined;

    if (!response || !response.ok) {
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to load chat session count"
        );
    }

    return response.json();
}

export async function getBuyerChatSessions() {
    const response = await authFetch(`${API_BASE}/Buyer/List-Chat-Sessions`, {
        method: "GET",
        mode: "cors",
    });

    if (!response) return null;

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
            errorBody?.detail ||
            errorBody?.message ||
            response.statusText ||
            "Failed to load chat sessions"
        );
    }

    const chatSessions = await response.json();

    if (!Array.isArray(chatSessions)) {
        throw new Error("The chat-session response was not a list");
    }

    return chatSessions;
}

export async function getProductConversationHistory(productId) {
    if (!productId) {
        throw new Error("Product id is required");
    }

    const response = await authFetch(`${API_BASE}/Products/get-product-history?product_id=${encodeURIComponent(productId)}`, {
        method: "GET",
        mode: "cors",
    });

    if (!response) return null;

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
            errorBody?.detail ||
            errorBody?.message ||
            response.statusText ||
            "Failed to load product conversations"
        );
    }

    const conversations = await response.json();

    if (!Array.isArray(conversations)) {
        throw new Error("The product-conversation response was not a list");
    }

    return conversations;
}

export async function loadChatMessages(publicId) {
    if (!publicId) {
        throw new Error("Public id is required");
    }

    const response = await authFetch(`${API_BASE}/Chat/Load-Chat?public_id=${encodeURIComponent(publicId)}`, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
    });

    const statusText = response ? response.statusText : undefined;

    if (!response || !response.ok) {
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to load chat history"
        );
    }

    const messages = await response.json();

    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .filter((message) => message && typeof message.content === "string")
        .map((message) => {
            const normalizedRole =
                typeof message.role === "string" && message.role.toLowerCase() === "user" ?
                "user" :
                "assistant";

            return {
                id: message.id,
                role: normalizedRole,
                content: message.content,
            };
        });
}

export async function sendLunaMessage(message, publicId) {
    if (!message || typeof message !== "string") {
        throw new Error("Chat message is required");
    }

    if (!publicId || typeof publicId !== "string") {
        throw new Error("Public id is required for chat");
    }

    const response = await authFetch(`${API_BASE}/Chat/Luna?public_id=${encodeURIComponent(publicId)}`, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });

    const statusText = response ? response.statusText : undefined;

    if (!response || !response.ok) {
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        const error = new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to send chat message"
        );
        error.status = response ? response.status : undefined;
        throw error;
    }

    const text = await response.text();

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        try {
            const jsonBody = JSON.parse(text);
            if (typeof jsonBody === "string") {
                return jsonBody;
            }
            if (jsonBody && typeof jsonBody.message === "string") {
                return jsonBody.message;
            }
        } catch {
            // Fall through to returning raw text if JSON parse fails
        }
    }

    return text;
}

export function renderProductCard(product, elements) {
    const title = (product && product.title) || "Untitled product";
    const description = (product && product.description) || "No description provided.";
    const price = Number((product && product.price) || 0);

    if (elements && elements.title) {
        elements.title.textContent = title;
    }

    if (elements && elements.productHero) {
        elements.productHero.setAttribute("aria-busy", "false");
    }

    if (elements && elements.price) {
        elements.price.textContent = `₱${price.toFixed(2)}`;
    }

    if (elements && elements.description) {
        elements.description.textContent = description;
    }

    if (elements && elements.socialLink && elements.socialLinkAnchor && elements.socialLinkHost) {
        elements.socialLink.hidden = true;
        const contactLinkValue = product && product.contact_link;
        if (typeof contactLinkValue === "string") {
            try {
                const contactLink = new URL(contactLinkValue);
                if (contactLink.protocol === "http:" || contactLink.protocol === "https:") {
                    elements.socialLinkAnchor.href = contactLink.href;
                    elements.socialLinkAnchor.title = contactLink.href;
                    elements.socialLinkHost.textContent = contactLink.hostname;
                    elements.socialLink.hidden = false;
                }
            } catch {
                // Hide malformed social links while leaving the product details available.
            }
        }
    }
}

export function renderNotFound(elements) {
    if (elements && elements.title) {
        elements.title.textContent = "Product not found";
    }

    if (elements && elements.price) {
        elements.price.textContent = "₱0.00";
    }

    if (elements && elements.productHero) {
        elements.productHero.setAttribute("aria-busy", "false");
    }

    if (elements && elements.description) {
        elements.description.textContent = "The requested product could not be loaded.";
    }

    if (elements && elements.socialLink) {
        elements.socialLink.hidden = true;
    }
}

export function createProductCard(product) {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.dataset.productId = product.id || "";
    card.dataset.publicId = product.public_id || product.publicId || "";

    const safeTitle = escapeHtml((product && product.title) || "Untitled product");
    const safeDescription = escapeHtml((product && product.description) || "No description provided.");
    const safePublicId = escapeHtml((product && (product.public_id || product.publicId)) || "N/A");
    const safePrice = Number(product && product.price) || 0;
    const statusValue = String((product && product.status) || "available").toLowerCase();
    const isSold = statusValue === "sold";
    const statusLabel = isSold ? "Sold" : "Available";

    card.dataset.productStatus = isSold ? "sold" : "available";

    card.innerHTML = `
        <div class="product-content">
            <h2>${safeTitle}</h2>
            <p>${safeDescription}</p>
            <p class="product-public-id">Public ID: ${safePublicId}</p>
            <div class="product-card-description" hidden>${safeDescription}</div>
        </div>
        <div class="product-meta">
            <span class="price">₱${safePrice.toFixed(2)}</span>
            <span class="product-status-label">${statusLabel}</span>
            <div class="actions">
                <button type="button" class="secondary-btn view-count-btn">View Count</button>
                <button type="button" class="secondary-btn view-conversations-btn">View Conversations</button>
                <button type="button" class="secondary-btn open-btn">Open</button>
                <button type="button" class="danger-btn">Delete</button>
                <button type="button" class="secondary-btn mark-as-sold-btn" ${isSold ? "disabled" : ""}>${isSold ? "Sold" : "Mark as Sold"}</button>
                <button type="button" class="secondary-btn copy-link-btn">Copy Link</button>
            </div>
        </div>
    `;

    // Attach clipboard copy handler
    const copyBtn = card.querySelector(".copy-link-btn");
    if (copyBtn) {
        copyBtn.addEventListener("click", async(e) => {
            e.preventDefault();
            e.stopPropagation();
            const pubId = product.public_id || product.publicId || "";
            if (!pubId) return;

            const link = `${window.location.origin}/Sell-Both-Website/product.html?public_id=${encodeURIComponent(pubId)}`;

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(link);
                } else {
                    const ta = document.createElement("textarea");
                    ta.value = link;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                }

                const originalText = copyBtn.textContent;
                copyBtn.textContent = "Copied!";
                setTimeout(() => (copyBtn.textContent = originalText), 2000);
            } catch (err) {
                console.error("Failed to copy product link:", err);
            }
        });
    }

    // Toggle expanded state when clicking the card (ignore clicks on buttons/actions)
    card.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest(".actions")) return;
        card.classList.toggle("expanded");
        const desc = card.querySelector(".product-card-description");
        if (desc) {
            desc.hidden = !card.classList.contains("expanded");
        }
    });

    return card;
}

export async function loadProducts(productGrid, listStatusText) {
    if (!listStatusText) return;

    listStatusText.textContent = "";
    productGrid.setAttribute("aria-busy", "true");
    productGrid.replaceChildren();

    for (let index = 0; index < 3; index += 1) {
        const skeletonCard = document.createElement("div");
        skeletonCard.className = "product-card product-card-skeleton";
        skeletonCard.setAttribute("aria-hidden", "true");
        skeletonCard.innerHTML = `
            <div class="product-content">
                <span class="skeleton skeleton-bar skeleton-product-title"></span>
                <span class="skeleton skeleton-bar skeleton-product-description"></span>
                <span class="skeleton skeleton-bar skeleton-product-id"></span>
            </div>
            <div class="product-meta">
                <span class="skeleton skeleton-product-price"></span>
                <span class="skeleton skeleton-product-status"></span>
                <div class="actions">
                    <span class="skeleton skeleton-product-action action-count"></span>
                    <span class="skeleton skeleton-product-action action-open"></span>
                    <span class="skeleton skeleton-product-action action-delete"></span>
                    <span class="skeleton skeleton-product-action action-sold"></span>
                    <span class="skeleton skeleton-product-action action-copy"></span>
                </div>
            </div>
        `;
        productGrid.appendChild(skeletonCard);
    }

    try {
        const response = await authFetch(`${API_BASE}/Products/list-product`, {
            method: "GET",
            mode: "cors",
        });

        if (!response) {
            productGrid.replaceChildren();
            productGrid.setAttribute("aria-busy", "false");
            return;
        }

        const statusTextResponse = response.statusText;

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(
                errorBody.detail ||
                errorBody.message ||
                statusTextResponse ||
                "Failed to load products"
            );
        }

        const products = await response.json();
        productGrid.replaceChildren();
        productGrid.setAttribute("aria-busy", "false");

        if (!Array.isArray(products) || products.length === 0) {
            listStatusText.textContent = "No products found.";
            return;
        }

        products.forEach((product) => {
            productGrid.appendChild(createProductCard(product));
        });

        listStatusText.textContent = "";
    } catch (error) {
        productGrid.replaceChildren();
        productGrid.setAttribute("aria-busy", "false");
        console.error("Failed to load products:", error);
        listStatusText.textContent = error.message || "Could not load products.";
    }
}