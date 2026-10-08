import { getProductChatMessages } from "./apiClient.js";

const messageList = document.getElementById("conversationMessageList");
const historyStatus = document.getElementById("conversationHistoryStatus");
const chatSessionId = new URLSearchParams(window.location.search).get("chat_session_id")?.trim() || "";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function setStatus(message, state = "") {
    historyStatus.textContent = message;
    historyStatus.className = `conversation-history-status${state ? ` ${state}` : ""}`;
    historyStatus.hidden = !message;
}

function createMessage(message) {
    const isBuyer = message?.role === "user";
    const isLuna = message?.role === "assistant";
    const row = document.createElement("article");
    row.className = `conversation-message-row ${isBuyer ? "is-buyer" : "is-luna"}`;

    const bubble = document.createElement("div");
    bubble.className = "conversation-message-bubble";

    const content = document.createElement("p");
    content.className = "conversation-message-content";
    content.textContent = typeof message?.content === "string" ?
        message.content : "Message content unavailable.";

    const sender = document.createElement("p");
    sender.className = "conversation-message-sender";
    sender.textContent = isBuyer ? "Buyer" : isLuna ? "Luna" : "Conversation";

    bubble.append(content, sender);
    row.append(bubble);
    return row;
}

function errorMessage(error) {
    switch (error?.status) {
        case 401:
            return "Your session has expired. Please sign in again to view this conversation.";
        case 403:
            return "You are not authorized to view this conversation.";
        case 404:
            return "This conversation could not be found.";
        case 429:
            return "Too many requests. Please wait a moment and try again.";
        case 500:
            return "The server could not load this conversation. Please try again later.";
        default:
            return error?.message || "Could not load this conversation. Please try again.";
    }
}

async function loadConversation() {
    if (!uuidPattern.test(chatSessionId)) {
        messageList.setAttribute("aria-busy", "false");
        setStatus("A valid chat session ID is required to view conversation history.", "is-error");
        return;
    }

    messageList.setAttribute("aria-busy", "true");

    try {
        const messages = await getProductChatMessages(chatSessionId);

        if (!messages) {
            setStatus("Your session has expired. Please sign in again to view this conversation.", "is-error");
            return;
        }

        if (messages.length === 0) {
            setStatus("This conversation does not contain any messages yet.", "is-empty");
            return;
        }

        messageList.replaceChildren(...messages.map((message) => createMessage(message)));
        setStatus("");
    } catch (error) {
        console.error("Failed to load product conversation:", error);
        setStatus(errorMessage(error), "is-error");
    } finally {
        messageList.setAttribute("aria-busy", "false");
    }
}

loadConversation();
