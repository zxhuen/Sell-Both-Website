import { getBuyerChatSessions } from "./apiClient.js";

const chatSessionList = document.getElementById("chatSessionList");
const chatHistoryStatus = document.getElementById("chatHistoryStatus");

function setStatus(message, state = "") {
    chatHistoryStatus.textContent = message;
    chatHistoryStatus.className = `chat-history-status${state ? ` ${state}` : ""}`;
}

function formatLastMessageAt(value) {
    if (typeof value !== "string" && typeof value !== "number") {
        return "Last message time unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Last message time unavailable";
    }

    return `Last message: ${date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    })}`;
}

function createChatSessionItem(chatSession) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "chat-session-item";

    const product = chatSession.product;
    const publicId = product && typeof product.public_id === "string" ?
        product.public_id.trim() : "";
    const productTitle = product && typeof product.title === "string" ?
        product.title : "Product unavailable";

    if (publicId) {
        item.addEventListener("click", () => {
            window.location.href = `product.html?public_id=${encodeURIComponent(publicId)}`;
        });
    } else {
        item.disabled = true;
        item.title = "This chat session's product link is unavailable.";
    }

    const title = document.createElement("span");
    title.className = "chat-session-title";
    title.textContent = productTitle || "Untitled product";

    const lastMessage = document.createElement("span");
    lastMessage.className = "chat-session-timestamp";
    lastMessage.textContent = formatLastMessageAt(chatSession.last_message_at);

    item.append(title, lastMessage);
    return item;
}

async function loadChatHistory() {
    chatSessionList.setAttribute("aria-busy", "true");

    try {
        const chatSessions = await getBuyerChatSessions();
        chatSessionList.replaceChildren();

        if (!chatSessions) {
            setStatus("");
            return;
        }

        if (chatSessions.length === 0) {
            setStatus("You don't have any chat sessions yet.", "is-empty");
            return;
        }

        chatSessions.forEach((chatSession) => {
            chatSessionList.appendChild(createChatSessionItem(chatSession));
        });
        setStatus("");
    } catch (error) {
        console.error("Failed to load buyer chat history:", error);
        setStatus(error.message || "Could not load chat history. Please try again.", "is-error");
    } finally {
        chatSessionList.setAttribute("aria-busy", "false");
    }
}

loadChatHistory();
