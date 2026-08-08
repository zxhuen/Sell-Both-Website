import { supabaseClient } from "./supabase.js";

const API_BASE = window.API_ENDPOINT || "http://localhost:8000";

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

export async function loadChatMessages(publicId) {
    if (!publicId) {
        throw new Error("Public id is required");
    }

    const response = await publicFetch(`${API_BASE}/Chat/Load-Chat?public_id=${encodeURIComponent(publicId)}`, {
        method: "GET",
        mode: "cors",
        credentials: "include",
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

    const response = await publicFetch(`${API_BASE}/Chat/Luna?public_id=${encodeURIComponent(publicId)}`, {
        method: "POST",
        mode: "cors",
        credentials: "include", // Ensures cookies are attached
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });

    const statusText = response ? response.statusText : undefined;

    if (!response || !response.ok) {
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(
            errorBody.detail ||
            errorBody.message ||
            statusText ||
            "Failed to send chat message"
        );
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
    const description =
        (product && product.description) || "No description provided.";
    const price = Number((product && product.price) || 0);

    if (elements && elements.title) {
        elements.title.textContent = title;
    }

    if (elements && elements.price) {
        elements.price.textContent = `₱${price.toFixed(2)}`;
    }

    if (elements && elements.description) {
        elements.description.textContent = description;
    }
}

export function renderNotFound(elements) {
    if (elements && elements.title) {
        elements.title.textContent = "Product not found";
    }

    if (elements && elements.price) {
        elements.price.textContent = "$0.00";
    }

    if (elements && elements.description) {
        elements.description.textContent =
            "The requested product could not be loaded.";
    }
}

function createProductCard(product) {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.dataset.productId = product.id || "";
    card.dataset.publicId = product.public_id || "";

    card.innerHTML = `
                <div class="product-content">
                    <h2>${product.title}</h2>
                    <p class="product-public-id">Public ID: ${product.public_id || "N/A"}</p>
                    <div class="product-card-description" style="display:none;">${product.description ? escapeHtml(product.description) : ""}</div>
                </div>
                <div class="product-meta">
                    <span class="price">$${parseFloat(product.price).toFixed(2)}</span>
                    <div class="actions">
                        <button class="secondary-btn">Open</button>
                        <button class="danger-btn">Delete</button>
                        <button type="button" class="secondary-btn copy-link-btn">Copy Link</button>
                    </div>
                </div>
        `;

    // Helper to escape HTML in inserted text
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Attach clipboard copy handler for the public product URL
    const copyBtn = card.querySelector(".copy-link-btn");
    if (copyBtn) {
        copyBtn.addEventListener("click", async(e) => {
            e.preventDefault();
            e.stopPropagation();
            const pubId = product.public_id || product.publicId || product.publicId;
            if (!pubId) return;

            const link = `${window.location.origin}/product.html?public_id=${encodeURIComponent(pubId)}`;

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

    // Toggle expanded state when clicking the card (ignore clicks on buttons/links)
    card.addEventListener("click", (e) => {
        if (e.target.closest('button') || e.target.closest('.actions')) return;
        card.classList.toggle('expanded');
        const desc = card.querySelector('.product-card-description');
        if (desc) {
            if (card.classList.contains('expanded')) {
                desc.style.display = 'block';
            } else {
                desc.style.display = 'none';
            }
        }
    });

    return card;
}

export async function loadProducts(productGrid, listStatusText) {
    if (!listStatusText) return;

    listStatusText.textContent = "Loading products...";
    productGrid.innerHTML = "";

    try {
        const response = await authFetch(`${API_BASE}/Products/list-product`, {
            method: "GET",
            mode: "cors",
        });

        const statusTextResponse = response ? response.statusText : undefined;

        if (!response || !response.ok) {
            const errorBody = response ? await response.json().catch(() => ({})) : {};
            throw new Error(
                errorBody.detail ||
                errorBody.message ||
                statusTextResponse ||
                "Failed to load products"
            );
        }

        const products = await response.json();

        if (!Array.isArray(products) || products.length === 0) {
            listStatusText.textContent = "No products found.";
            return;
        }

        products.forEach((product) => {
            productGrid.appendChild(createProductCard(product));
        });

        listStatusText.textContent = "";
    } catch (error) {
        console.error("Failed to load products:", error);
        listStatusText.textContent = error.message || "Could not load products.";
    }
}