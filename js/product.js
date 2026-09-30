import { getProductByPublicId, loadChatMessages, renderNotFound, renderProductCard, sendLunaMessage } from "./apiClient.js";

const params = new URLSearchParams(window.location.search);
const publicId = params.get("public_id") || params.get("id");

const elements = {
    productHero: document.getElementById("productHero"),
    title: document.getElementById("productTitle"),
    price: document.getElementById("productPrice"),
    description: document.getElementById("productDescription"),
    chatMessages: document.getElementById("chatMessages"),
    chatForm: document.getElementById("chatForm"),
    chatInput: document.getElementById("chatInput"),
    sendButton: document.querySelector("#chatForm .send-btn"),
};

let isSendingMessage = false;

function createMessageElement(role, text) {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = role === "user" ? "message user-message" : "message assistant-message";

    if (role !== "user") {
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
    content.textContent = text || "";
    messageWrapper.appendChild(content);

    return messageWrapper;
}

function renderChatMessages(messages, container) {
    if (!container) return;

    container.innerHTML = "";
    container.setAttribute("aria-busy", "false");

    if (!Array.isArray(messages) || messages.length === 0) {
        const emptyState = createMessageElement("assistant", "No chat history yet for this product.");
        container.appendChild(emptyState);
        return;
    }

    messages.forEach((message) => {
        container.appendChild(createMessageElement(message.role, message.content || ""));
    });
}

function appendChatMessage(role, text) {
    if (!elements.chatMessages) return;
    elements.chatMessages.appendChild(createMessageElement(role, text));
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

async function handleChatSubmit(event) {
    event.preventDefault();

    if (!elements.chatInput || !elements.chatMessages || isSendingMessage) {
        return;
    }

    const message = elements.chatInput.value.trim();
    if (!message) {
        return;
    }

    isSendingMessage = true;
    if (elements.sendButton) {
        elements.sendButton.disabled = true;
    }

    elements.chatInput.value = "";
    appendChatMessage("user", message);

    const loadingMessage = createMessageElement("assistant", "");
    const loadingContent = loadingMessage.querySelector(".message-content");
    loadingContent.classList.add("skeleton", "skeleton-chat");
    loadingContent.setAttribute("aria-hidden", "true");
    elements.chatMessages.appendChild(loadingMessage);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    try {
        const assistantText = await sendLunaMessage(message, publicId);
        loadingContent.classList.remove("skeleton", "skeleton-chat");
        loadingContent.removeAttribute("aria-hidden");
        loadingContent.textContent = assistantText || "No response received.";
    } catch (err) {
        console.error("Failed to send chat message:", err);
        loadingContent.classList.remove("skeleton", "skeleton-chat");
        loadingContent.removeAttribute("aria-hidden");
        loadingContent.textContent = "Unable to get a response. Please try again.";
    } finally {
        isSendingMessage = false;
        if (elements.sendButton) {
            elements.sendButton.disabled = false;

        }
    }
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
    if (!elements.chatMessages) {
        return;
    }

    if (!publicId) {
        renderChatMessages([], elements.chatMessages);
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
    if (elements.chatForm) {
        elements.chatForm.addEventListener("submit", handleChatSubmit);
    }

    await fetchProductDetails();
    await fetchChatHistory();
}

initializePage();