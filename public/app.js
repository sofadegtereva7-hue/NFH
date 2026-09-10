const API_URL = "https://nfh.freeevolution.workers.dev";

const messagesContainer = document.getElementById("messages");
const authorInput = document.getElementById("author");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const statusElement = document.getElementById("status");


function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
}


function renderPosts(posts) {
  if (!posts || posts.length === 0) {
    messagesContainer.innerHTML = "<p>No messages yet.</p>";
    return;
  }

  messagesContainer.innerHTML = posts.map(post => {
    let replyInfo = "";

    if (post.replyTo) {
      const repliedPost = posts.find(item => item.id === post.replyTo);

      if (repliedPost) {
        replyInfo = `
          <div class="message-reply">
            ↩ reply to <span>${escapeHtml(repliedPost.author)}</span>
          </div>
        `;
      } else {
        replyInfo = `
          <div class="message-reply">
            ↩ reply to another message
          </div>
        `;
      }
    }

    return `
      <article class="message">
        <div>
          <span class="message-author">${escapeHtml(post.author)}</span>
          <span class="message-time">${escapeHtml(formatDate(post.createdAt))}</span>
        </div>

        ${replyInfo}

        <div class="message-text">${escapeHtml(post.message)}</div>
      </article>
    `;
  }).join("");
}


async function loadPosts() {
  try {
    const response = await fetch(`${API_URL}/api/posts`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to load messages.");
    }

    renderPosts(data.posts);
  } catch (error) {
    console.error(error);

    messagesContainer.innerHTML =
      "<p>Could not load messages.</p>";
  }
}


async function sendPost() {
  const author = authorInput.value.trim();
  const message = messageInput.value.trim();

  if (!author || !message) {
    statusElement.textContent =
      "Please enter both your name and a message.";
    return;
  }

  sendButton.disabled = true;
  statusElement.textContent = "Posting...";

  try {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        author: author,
        message: message
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    authorInput.value = "";
    messageInput.value = "";

    statusElement.textContent = "Message posted.";

    await loadPosts();

  } catch (error) {
    console.error(error);

    statusElement.textContent =
      "Could not post the message.";
  } finally {
    sendButton.disabled = false;
  }
}


sendButton.addEventListener("click", sendPost);


messageInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    sendPost();
  }
});


loadPosts();