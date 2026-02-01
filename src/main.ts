const container = document.querySelector(".container") as HTMLElement;
const chatsContainer = document.querySelector(".chats-container") as HTMLElement;
const promptForm = document.querySelector(".prompt-form") as HTMLFormElement;
const promptInput = document.querySelector(".prompt-input") as HTMLInputElement;
const themeToggleBtn = document.querySelector("#theme-toggle-btn") as HTMLButtonElement;
const fileInput = document.querySelector("#file-input") as HTMLInputElement;
const fileUploadWrapper = document.querySelector(".file-upload-wrapper") as HTMLElement;

let controller: AbortController | null = null;
let typingInterval: number;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const chatHistory: ChatMessage[] = [];

// ================= THEME =================
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";

// ================= HELPERS =================
const createMessageElement = (content: string, ...classes: string[]) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const scrollToBottom = () => {
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
};

// ================= TYPING =================
const typingEffect = (
  text: string,
  textElement: HTMLElement,
  botMsgDiv: HTMLElement
) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let index = 0;

  typingInterval = window.setInterval(() => {
    if (index < words.length) {
      textElement.textContent += (index === 0 ? "" : " ") + words[index++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 35);
};

// ================= API CALL =================
const generateResponse = async (botMsgDiv: HTMLElement) => {
  const textElement = botMsgDiv.querySelector(".message-text") as HTMLElement;
  controller = new AbortController();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }),
      signal: controller.signal
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    typingEffect(text, textElement, botMsgDiv);
    chatHistory.push({ role: "assistant", content: text });

  } catch (err: any) {
    textElement.textContent = "Erro ao gerar resposta";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  }
};

// ================= FORM =================
promptForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = promptInput.value.trim();
  if (!message || document.body.classList.contains("bot-responding")) return;

  promptInput.value = "";
  document.body.classList.add("chats-active", "bot-responding");

  chatHistory.push({ role: "user", content: message });

  const userDiv = createMessageElement(
    `<p class="message-text">${message}</p>`,
    "user-message"
  );
  chatsContainer.appendChild(userDiv);
  scrollToBottom();

  setTimeout(() => {
    const botDiv = createMessageElement(
      `<img class="avatar" src="groq.svg"><p class="message-text">A pensar...</p>`,
      "bot-message",
      "loading"
    );
    chatsContainer.appendChild(botDiv);
    scrollToBottom();
    generateResponse(botDiv);
  }, 400);
});

// ================= EXTRAS =================
fileInput.disabled = true;
fileUploadWrapper.style.display = "none";

themeToggleBtn.addEventListener("click", () => {
  const light = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", light ? "light_mode" : "dark_mode");
  themeToggleBtn.textContent = light ? "dark_mode" : "light_mode";
});
