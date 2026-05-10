// =============================================
//   CHATBOT APP - GROQ API INTEGRATION
// =============================================

let conversationHistory = [];
let isTyping = false;

// Page load hone par
window.onload = function () {
  document.getElementById("userInput").focus();
};

// Enter key press handle karo
function handleKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Quick option buttons
function sendQuick(text) {
  document.getElementById("userInput").value = text;
  sendMessage();
}

// Message send karo
async function sendMessage() {
  const input = document.getElementById("userInput");
  const userText = input.value.trim();

  if (!userText || isTyping) return;

  // Welcome screen hide karo
  const welcomeScreen = document.getElementById("welcomeScreen");
  if (welcomeScreen) {
    welcomeScreen.style.opacity = "0";
    welcomeScreen.style.transform = "scale(0.95)";
    setTimeout(() => welcomeScreen.remove(), 300);
  }

  // User message dikhao
  appendMessage("user", userText);
  input.value = "";
  input.focus();

  // History mein add karo
  conversationHistory.push({
    role: "user",
    content: userText,
  });

  // Typing indicator dikhao
  showTypingIndicator();
  isTyping = true;

  try {
    const response = await callGroqAPI(userText);
    hideTypingIndicator();
    isTyping = false;
    appendMessage("bot", response);

    // Bot reply history mein add karo
    conversationHistory.push({
      role: "assistant",
      content: response,
    });

    // Max 20 messages raho memory mein
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }
  } catch (error) {
    hideTypingIndicator();
    isTyping = false;
    appendMessage(
      "bot",
      "⚠️ Maafi chahta hoon, kuch error aa gayi. Kripya apni API key check karein ya dobara try karein.\n\n**Error:** " +
        error.message
    );
    console.error("API Error:", error);
  }
}

// Groq API call
async function callGroqAPI(userMessage) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: CONFIG.SYSTEM_PROMPT,
        },
        ...conversationHistory,
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Message append karo DOM mein
function appendMessage(sender, text) {
  const messagesDiv = document.getElementById("chatMessages");

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}-message`;

  if (sender === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = `<div class="mini-bot">🤖</div>`;
    msgDiv.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.innerHTML = formatText(text);

  msgDiv.appendChild(bubble);
  messagesDiv.appendChild(msgDiv);

  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Animation
  setTimeout(() => msgDiv.classList.add("visible"), 10);
}

// Text format karo (basic markdown)
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

// Typing indicator dikhao
function showTypingIndicator() {
  const messagesDiv = document.getElementById("chatMessages");

  const typing = document.createElement("div");
  typing.className = "message bot-message typing-container";
  typing.id = "typingIndicator";

  typing.innerHTML = `
    <div class="msg-avatar"><div class="mini-bot">🤖</div></div>
    <div class="message-bubble typing-bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;

  messagesDiv.appendChild(typing);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  setTimeout(() => typing.classList.add("visible"), 10);
}

// Typing indicator hatao
function hideTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}
