import { getProductByPublicId, loadChatMessages, renderNotFound, renderProductCard } from "./apiClient.js";

const params = new URLSearchParams(window.location.search);
const publicId = params.get("public_id") || params.get("id");

const elements = {
    title: document.getElementById("productTitle"),
    price: document.getElementById("productPrice"),
    description: document.getElementById("productDescription"),
    chatMessages: document.getElementById("chatMessages"),
};

function renderChatMessages(messages, container) {
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(messages) || messages.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "message assistant-message";
        emptyState.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-content">No chat history yet for this product.</div>
        `;
        container.appendChild(emptyState);
        return;
    }

    messages.forEach((message) => {
        const messageWrapper = document.createElement("div");
        messageWrapper.className = message.role === "user" ? "message user-message" : "message assistant-message";

        if (message.role !== "user") {
            const avatar = document.createElement("div");
            avatar.className = "message-avatar";
            const avatarImage = document.createElement("img");
            avatarImage.src = "images/marin.png";
            avatarImage.alt = "Marin assistant";
            avatar.appendChild(avatarImage);
            messageWrapper.appendChild(avatar);
        }

        const content = document.createElement("div");
        content.className = "message-content";
        content.textContent = message.content || "";
        messageWrapper.appendChild(content);

        container.appendChild(messageWrapper);
    });
}

async function fetchProductDetails() {
    if (!publicId) {
        renderNotFound(elements);
        return;
    }

    try {
        const product = await getProductByPublicId(publicId);
        renderProductCard(product, elements);
    } catch (err) {
        console.error("Failed to load product:", err);
        renderNotFound(elements);
    }
}

async function fetchChatHistory() {
    if (!publicId || !elements.chatMessages) {
        return;
    }

    try {
        const messages = await loadChatMessages(publicId);
        renderChatMessages(messages, elements.chatMessages);
    } catch (err) {
        console.error("Failed to load chat history:", err);
        renderChatMessages([], elements.chatMessages);
    }
}

async function initializePage() {
    await fetchProductDetails();
    await fetchChatHistory();
}

initializePage();