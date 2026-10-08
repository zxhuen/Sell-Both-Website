import { getProductConversationHistory } from "./apiClient.js";

const conversationList = document.getElementById("productConversationList");
const historyStatus = document.getElementById("productHistoryStatus");
const defaultAvatarUrl = "images/image.jpg";
const productId = new URLSearchParams(window.location.search).get("product_id")?.trim() || "";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function setStatus(message, state = "") {
    historyStatus.replaceChildren(document.createTextNode(message));
    historyStatus.className = `product-history-status${state ? ` ${state}` : ""}`;
    historyStatus.hidden = !message;
}

function showEmptyState() {
    const heading = document.createElement("h2");
    heading.textContent = "No conversations yet";

    const explanation = document.createElement("p");
    explanation.textContent = "No one has interacted with this product yet.";

    historyStatus.replaceChildren(heading, explanation);
    historyStatus.className = "product-history-status is-empty";
    historyStatus.hidden = false;
}

function formatLastActivity(value) {
    if (typeof value !== "string" && typeof value !== "number") {
        return "Activity time unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Activity time unavailable";
    }

    const localDate = date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    const localTime = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });

    return `${localDate} · ${localTime}`;
}

function formatPrice(value) {
    if (value === null || value === undefined || value === "") {
        return "Price unavailable";
    }

    const price = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(price)) {
        return "Price unavailable";
    }

    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price);
}

function createConversationCard(session) {
    const product = session?.product;
    const user = session?.user;
    const displayName = typeof user?.display_name === "string" && user.display_name.trim() ?
        user.display_name.trim() : "Unknown User";
    const avatarUrl = typeof user?.avatar_url === "string" && user.avatar_url.trim() ?
        user.avatar_url.trim() : defaultAvatarUrl;
    const productTitle = typeof product?.title === "string" && product.title.trim() ?
        product.title.trim() : "Product unavailable";

    const card = document.createElement("article");
    card.className = "product-conversation-card";

    const userDetails = document.createElement("div");
    userDetails.className = "conversation-user";

    const avatar = document.createElement("img");
    avatar.className = "conversation-user-avatar";
    avatar.src = avatarUrl;
    avatar.alt = "";
    avatar.setAttribute("aria-hidden", "true");
    avatar.addEventListener("error", () => {
        if (avatar.src !== new URL(defaultAvatarUrl, document.baseURI).href) {
            avatar.src = defaultAvatarUrl;
        }
    }, { once: true });

    const name = document.createElement("h2");
    name.className = "conversation-user-name";
    name.textContent = displayName;
    userDetails.append(avatar, name);

    const productDetails = document.createElement("div");
    productDetails.className = "conversation-product";

    const title = document.createElement("p");
    title.className = "conversation-product-title";
    title.textContent = productTitle;

    const price = document.createElement("p");
    price.className = "conversation-product-price";
    price.textContent = formatPrice(product?.price);
    productDetails.append(title, price);

    const activity = document.createElement("div");
    activity.className = "conversation-activity";

    const activityLabel = document.createElement("p");
    activityLabel.className = "conversation-activity-label";
    activityLabel.textContent = "Last activity";

    const activityTime = document.createElement("time");
    activityTime.className = "conversation-activity-time";
    activityTime.dateTime = typeof session?.last_message_at === "string" ?
        session.last_message_at : "";
    activityTime.textContent = formatLastActivity(session?.last_message_at);
    activity.append(activityLabel, activityTime);

    card.append(userDetails, productDetails, activity);
    return card;
}

async function loadProductConversations() {
    if (!uuidPattern.test(productId)) {
        conversationList.setAttribute("aria-busy", "false");
        setStatus("A valid product ID is required to view conversations.", "is-error");
        return;
    }

    conversationList.setAttribute("aria-busy", "true");

    try {
        const conversations = await getProductConversationHistory(productId);

        if (!conversations) {
            setStatus("Please sign in to view product conversations.", "is-error");
            return;
        }

        if (conversations.length === 0) {
            showEmptyState();
            return;
        }

        conversationList.replaceChildren(
            ...conversations.map((session) => createConversationCard(session))
        );
        setStatus("");
    } catch (error) {
        console.error("Failed to load product conversations:", error);
        setStatus(error.message || "Could not load product conversations. Please try again.", "is-error");
    } finally {
        conversationList.setAttribute("aria-busy", "false");
    }
}

loadProductConversations();
