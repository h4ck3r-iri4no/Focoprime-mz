const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");

// Helpers
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};
const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

let controller = null;
let typingInterval = null;
const chatHistory = [];

// Typing effect
const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let index = 0;
  typingInterval = setInterval(() => {
    if (index < words.length) textElement.textContent += (index === 0 ? "" : " ") + words[index++];
    else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
    scrollToBottom();
  }, 35);
};

// Chamar API Vercel
const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }),
      signal: controller.signal
    });

    const data = await res.json();
    const text = data.choices[0].message.content.trim();
    typingEffect(text, textElement, botMsgDiv);
    chatHistory.push({ role: "assistant", content: text });

  } catch (err) {
    textElement.textContent = "Erro ao gerar resposta";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  }
};

// Form submit
promptForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = promptInput.value.trim();
  if (!message || document.body.classList.contains("bot-responding")) return;

  promptInput.value = "";
  document.body.classList.add("chats-active", "bot-responding");
  chatHistory.push({ role: "user", content: message });

  const userDiv = createMessageElement(`<p class="message-text">${message}</p>`, "user-message");
  chatsContainer.appendChild(userDiv);
  scrollToBottom();

  setTimeout(() => {
    const botDiv = createMessageElement(`<img class="avatar" src="groq.svg"><p class="message-text">A pensar...</p>`, "bot-message", "loading");
    chatsContainer.appendChild(botDiv);
    scrollToBottom();
    generateResponse(botDiv);
  }, 400);
});

// Botões extras
themeToggleBtn.addEventListener("click", () => {
  const light = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", light ? "light_mode" : "dark_mode");
  themeToggleBtn.textContent = light ? "dark_mode" : "light_mode";
});
document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatsContainer.innerHTML = "";
  document.body.classList.remove("chats-active", "bot-responding");
});
document.querySelectorAll(".suggestions-item").forEach(item => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  controller?.abort();
  clearInterval(typingInterval);
  document.body.classList.remove("bot-responding");
  const loadingMsg = chatsContainer.querySelector(".bot-message.loading");
  if (loadingMsg) loadingMsg.classList.remove("loading");
});
