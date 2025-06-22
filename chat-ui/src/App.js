import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

function generateChatId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

const BOT_WELCOME =
  "Chào bạn! Tôi là trợ lý ảo tuyển sinh của Đại học Bách Khoa Đà Nẵng. Bạn cần hỗ trợ thông tin gì?";

function App() {
  // State for all chat sessions
  const [chats, setChats] = useState([
    {
      id: generateChatId(),
      title: "Cuộc trò chuyện mới",
      messages: [{ from: "bot", text: BOT_WELCOME }],
      createdAt: new Date(),
    },
  ]);
  // Currently selected chat index
  const [currentChatIdx, setCurrentChatIdx] = useState(0);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatIdx]);

  // Handle sending message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = input;
    setInput("");

    // Lưu lại chỉ số chat hiện tại
    const chatIdx = currentChatIdx;

    // Cập nhật tin nhắn user vào đúng chat
    setChats((prevChats) => {
      const updatedChats = [...prevChats];
      updatedChats[chatIdx] = {
        ...updatedChats[chatIdx],
        messages: [
          ...updatedChats[chatIdx].messages,
          { from: "user", text: userMessage },
        ],
      };
      return updatedChats;
    });

    try {
      const response = await axios.post("http://127.0.0.1:8000/ask", {
        question: userMessage,
      });
      setChats((prevChats) => {
        // Dùng lại chatIdx, không dùng currentChatIdx vì có thể đã thay đổi
        const updatedChats = [...prevChats];
        updatedChats[chatIdx] = {
          ...updatedChats[chatIdx],
          messages: [
            ...updatedChats[chatIdx].messages,
            {
              from: "bot",
              text:
                response.data && response.data.llm_answers
                  ? response.data.llm_answers
                  : "Không có phản hồi từ bot.",
            },
          ],
        };
        return updatedChats;
      });
    } catch (error) {
      let errorMsg = "Lỗi kết nối tới server.";
      if (error.response && error.response.data) {
        errorMsg =
          error.response.data.detail ||
          JSON.stringify(error.response.data) ||
          errorMsg;
      }
      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        updatedChats[chatIdx] = {
          ...updatedChats[chatIdx],
          messages: [
            ...updatedChats[chatIdx].messages,
            { from: "bot", text: errorMsg },
          ],
        };
        return updatedChats;
      });
    }
  };

  // Create new chat
  const handleNewChat = () => {
    setChats((prevChats) => [
      {
        id: generateChatId(),
        title: "Cuộc trò chuyện mới",
        messages: [{ from: "bot", text: BOT_WELCOME }],
        createdAt: new Date(),
      },
      ...prevChats,
    ]);
    setCurrentChatIdx(0);
  };

  // Switch chat
  const handleSelectChat = (idx) => {
    setCurrentChatIdx(idx);
  };

  // Rename chat (optional, on first user message)
  useEffect(() => {
    const chat = chats[currentChatIdx];
    if (
      chat &&
      chat.title === "Cuộc trò chuyện mới" &&
      chat.messages.length > 1
    ) {
      // Use first user message as title
      const firstUserMsg = chat.messages.find((m) => m.from === "user");
      if (firstUserMsg) {
        setChats((prevChats) => {
          const updatedChats = [...prevChats];
          updatedChats[currentChatIdx] = {
            ...chat,
            title:
              firstUserMsg.text.slice(0, 30) +
              (firstUserMsg.text.length > 30 ? "..." : ""),
          };
          return updatedChats;
        });
      }
    }
    // eslint-disable-next-line
  }, [chats, currentChatIdx]);

  const currentMessages = chats[currentChatIdx]?.messages || [];

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <button className="new-chat-btn" onClick={handleNewChat}>
          + New chat
        </button>
        <div className="chat-history-list">
          {chats.map((chat, idx) => (
            <div
              key={chat.id}
              className={`chat-history-item${
                idx === currentChatIdx ? " active" : ""
              }`}
              onClick={() => handleSelectChat(idx)}
              title={chat.title}
            >
              <span className="chat-history-title">{chat.title}</span>
              <span className="chat-history-date">
                {chat.createdAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      </aside>
      <div className="chat-container">
        <div className="chat-header">
          <img src="/images.png" alt="logo" className="chat-logo" />
          <span>Hi Nguyễn Văn Duy, bạn cần hỗ trợ gì?</span>
          <span className="subtitle">
            Trợ lý ảo tuyển sinh Đại học Bách Khoa Đà Nẵng
          </span>
        </div>
        <div className="chat-messages">
          {currentMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${msg.from === "user" ? "user" : "bot"}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-area" onSubmit={handleSend}>
          <input
            className="chat-input"
            type="text"
            placeholder="How can I help you today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="chat-send-btn" type="submit">
            <span style={{ fontWeight: 700 }}>➤</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
