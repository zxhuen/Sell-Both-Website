import { getCustomerChats } from "./apiClient.js";

const chatList = document.getElementById("customerChatList");
const status = document.getElementById("customerChatsStatus");
const count = document.getElementById("customerChatsCount");
const loadMoreButton = document.getElementById("loadMoreChats");
const pageSize = 10;
const chatSessionUrl = "conversation_history.html?chat_session_id=";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const loadedChatIds = new Set();
let nextOffset = 0;
let isLoading = false;
let hasMore = true;
let hasLoadError = false;

function setStatus(message, state = "") {
    status.textContent = message;
    status.className = `customer-chats-status${state ? ` ${state}` : ""}`;
    status.hidden = !message;
}

function getInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase() || "?";
}

function formatPrice(value) {
    if (value === null || value === undefined || value === "") {
        return "Price unavailable";
    }

    const price = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(price)) {
        return "Price unavailable";
    }

    return `₱${new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price)}`;
}

function formatLastActivity(value) {
    if (typeof value !== "string" && typeof value !== "number") {
        return "Time unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Time unavailable";
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
    ).toDateString();

    if (isToday) {
        return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }

    if (isYesterday) {
        return "Yesterday";
    }

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function createAvatar(name, avatarUrl) {
    const avatar = document.createElement("span");
    avatar.className = "customer-chat-avatar";

    const fallback = document.createElement("span");
    fallback.className = "customer-chat-avatar-fallback";
    fallback.textContent = getInitials(name);
    avatar.appendChild(fallback);

    if (avatarUrl) {
        const image = document.createElement("img");
        image.className = "customer-chat-avatar-image";
        image.src = avatarUrl;
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        image.addEventListener("error", () => {
            image.remove();
            avatar.classList.remove("has-image");
        }, { once: true });
        avatar.classList.add("has-image");
        avatar.appendChild(image);
    }

    return avatar;
}

function createChatRow(session) {
    const user = session?.user;
    const product = session?.product;
    const displayName = typeof user?.display_name === "string" && user.display_name.trim() ?
        user.display_name.trim() : "Unknown customer";
    const avatarUrl = typeof user?.avatar_url === "string" ? user.avatar_url.trim() : "";
    const productTitle = typeof product?.title === "string" && product.title.trim() ?
        product.title.trim() : "Product unavailable";
    const chatSessionId = typeof session?.id === "string" ? session.id.trim() : "";

    const row = document.createElement("button");
    row.type = "button";
    row.className = "customer-chat-row";
    row.appendChild(createAvatar(displayName, avatarUrl));

    const details = document.createElement("span");
    details.className = "customer-chat-details";

    const name = document.createElement("span");
    name.className = "customer-chat-name";
    name.textContent = displayName;

    const productLine = document.createElement("span");
    productLine.className = "customer-chat-product";
    productLine.append(document.createTextNode(productTitle));

    const price = document.createElement("span");
    price.className = "customer-chat-price";
    price.textContent = formatPrice(product?.price);
    productLine.append(" · ", price);

    details.append(name, productLine);
    row.appendChild(details);

    const activity = document.createElement("time");
    activity.className = "customer-chat-activity";
    activity.dateTime = typeof session?.last_message_at === "string" ?
        session.last_message_at : "";
    activity.textContent = formatLastActivity(session?.last_message_at);
    activity.setAttribute("aria-label", `Last activity: ${activity.textContent}`);
    row.appendChild(activity);

    if (uuidPattern.test(chatSessionId)) {
        row.addEventListener("click", () => {
            window.location.href = `${chatSessionUrl}${encodeURIComponent(chatSessionId)}`;
        });
        row.setAttribute("aria-label", `Open conversation with ${displayName} about ${productTitle}`);
    } else {
        row.disabled = true;
        row.title = "This conversation has an invalid session ID.";
    }

    return row;
}

function updateCount() {
    const total = loadedChatIds.size;
    count.textContent = total ? `${total} loaded` : "";
}

function updateLoadMoreButton() {
    loadMoreButton.hidden = !hasMore && !hasLoadError;
    loadMoreButton.disabled = isLoading;
    loadMoreButton.textContent = hasLoadError ? "Try again" : "Load more conversations";
}

async function loadNextPage() {
    if (isLoading || (!hasMore && !hasLoadError)) {
        return;
    }

    isLoading = true;
    hasLoadError = false;
    chatList.setAttribute("aria-busy", "true");
    updateLoadMoreButton();
    setStatus("Loading customer conversations…");

    try {
        const sessions = await getCustomerChats(nextOffset, pageSize);

        if (!sessions) {
            setStatus("Please sign in to view customer conversations.", "is-error");
            hasMore = false;
            return;
        }

        let addedCount = 0;
        sessions.forEach((session) => {
            const id = typeof session?.id === "string" ? session.id.trim() : "";

            if (!id || loadedChatIds.has(id)) {
                return;
            }

            loadedChatIds.add(id);
            chatList.appendChild(createChatRow(session));
            addedCount += 1;
        });

        nextOffset += sessions.length;
        hasMore = sessions.length === pageSize;
        updateCount();

        if (loadedChatIds.size === 0) {
            setStatus("No customer conversations yet.", "is-empty");
        } else if (!hasMore) {
            setStatus("You’re all caught up.", "is-end");
        } else {
            setStatus(addedCount === 0 ? "No new conversations on this page." : "");
        }
    } catch (error) {
        console.error("Failed to load customer chats:", error);
        hasLoadError = true;
        setStatus(error.message || "Could not load customer conversations. Please try again.", "is-error");
    } finally {
        isLoading = false;
        chatList.setAttribute("aria-busy", "false");
        updateLoadMoreButton();
    }
}

loadMoreButton.addEventListener("click", loadNextPage);
loadNextPage();
