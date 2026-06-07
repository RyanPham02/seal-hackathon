"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button, Input, Avatar, Tooltip } from "antd";
import { MessageOutlined, CloseOutlined, MinusOutlined, SendOutlined, RobotOutlined, UserOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

type MessageType = {
  id: number;
  sender: "bot" | "user";
  text: string;
  action?: { label: string; path: string } | null;
};

// Renders **bold** markers as <strong> React nodes without injecting raw HTML.
// Splitting on a capturing group yields alternating plain/bold segments
// (odd indices are the captured bold text), so user-controlled text is always
// rendered as escaped React children — never parsed as markup.
function renderFormattedText(text: string): React.ReactNode[] {
  return text.split(/\*\*(.*?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? <strong key={index}>{part}</strong> : part,
  );
}

const defaultMessages: MessageType[] = [
  {
    id: 1,
    sender: "bot",
    text: 'Hi! I am the SEAL virtual assistant. Ask me about registration, rules, prizes, teams, or mentors.',
  },
];

export default function AIChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [role, setRole] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>(defaultMessages);
  const nextIdRef = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
      if (!stored) {
        setRole("");
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      try {
        const user = JSON.parse(stored);
        if (Array.isArray(user.roles) && user.roles.includes("Admin")) {
          setRole("Admin");
        } else {
          setRole(user.role || user.roles?.[0] || "");
        }
      } catch {
        setRole("");
      }
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (role === "Admin") return null;

  const suggestedQuestions = [
    "How do I register?",
    "Competition rules",
    "Prize structure",
    "Find mentors or teammates",
  ];

  const removeAccents = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const handleSendQuestion = (questionText?: string) => {
    const textToSend = questionText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage: MessageType = {
      id: nextIdRef.current++,
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const normalizedInput = removeAccents(userMessage.text);
      const botMessage: MessageType = {
        id: nextIdRef.current++,
        sender: "bot",
        text: "",
        action: null,
      };

      if (normalizedInput.includes("dang ky") || normalizedInput.includes("register") || normalizedInput.includes("tham gia")) {
        botMessage.text = "To register for SEAL Hackathon, create a team from My Team or use Matchmaking to find teammates.";
        botMessage.action = { label: "Go to Teams", path: "/dashboard/teams" };
      } else if (normalizedInput.includes("rule") || normalizedInput.includes("the le") || normalizedInput.includes("noi quy")) {
        botMessage.text = "Competition rules: teams must have 3-5 members, submissions must be original, and each round must be submitted before its deadline.";
      } else if (normalizedInput.includes("prize") || normalizedInput.includes("giai thuong") || normalizedInput.includes("thuong")) {
        botMessage.text = "Prize details are available on the Prizes page.";
        botMessage.action = { label: "View Prizes", path: "/dashboard/prizes" };
      } else if (normalizedInput.includes("team") || normalizedInput.includes("nhom") || normalizedInput.includes("doi")) {
        botMessage.text = "You can manage your team from My Team. If you need teammates, open Matchmaking and send invitations.";
        botMessage.action = { label: "Open Teams", path: "/dashboard/teams" };
      } else if (normalizedInput.includes("mentor") || normalizedInput.includes("huong dan")) {
        botMessage.text = "Mentors are assigned to support teams. You can see mentor-related updates from your team workspace.";
      } else {
        botMessage.text = "I can help with SEAL Hackathon registration, rules, prizes, teams, matchmaking, and mentors.";
      }

      setMessages((prev) => [...prev, botMessage]);
    }, 600);
  };

  return (
    <>
      {!isOpen && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined style={{ fontSize: 24 }} />}
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: 30,
            right: 30,
            width: 60,
            height: 60,
            boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)",
            zIndex: 1000,
            background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
          }}
        />
      )}

      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: 30,
          right: 30,
          width: 350,
          height: 500,
          backgroundColor: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}>
          <div style={{
            padding: 16,
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: "#3b82f6" }} />
              <div>
                <div style={{ fontWeight: "bold", fontSize: 15 }}>SEAL AI Assistant</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Always online</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Tooltip title="Minimize">
                <Button type="text" icon={<MinusOutlined style={{ color: "#fff" }} />} onClick={() => setIsOpen(false)} />
              </Tooltip>
              <Tooltip title="Close and clear chat">
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ color: "#fff" }} />}
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(() => {
                      setMessages(defaultMessages);
                      nextIdRef.current = 2;
                    }, 300);
                  }}
                />
              </Tooltip>
            </div>
          </div>

          <div style={{
            flex: 1,
            padding: 16,
            overflowY: "auto",
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                gap: 8,
              }}>
                {msg.sender === "bot" && <Avatar icon={<RobotOutlined />} size="small" style={{ backgroundColor: "#1e3a8a" }} />}

                <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0",
                    backgroundColor: msg.sender === "user" ? "#3b82f6" : "#fff",
                    color: msg.sender === "user" ? "#fff" : "#334155",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: "pre-line",
                  }}>{renderFormattedText(msg.text)}</div>

                  {msg.action && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<ArrowRightOutlined />}
                      onClick={() => {
                        if (!isLoggedIn) {
                          router.push(`/auth/login?redirect=${encodeURIComponent(msg.action!.path)}`);
                        } else {
                          router.push(msg.action!.path);
                        }
                        setIsOpen(false);
                      }}
                      style={{ alignSelf: "flex-start", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 12 }}
                    >
                      {msg.action.label}
                    </Button>
                  )}
                </div>

                {msg.sender === "user" && <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: "#94a3b8" }} />}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: "8px 12px",
            backgroundColor: "#fff",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: 8,
            overflowX: "auto",
            whiteSpace: "nowrap",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
            <div className="suggestions-container" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              {suggestedQuestions.map((q) => (
                <Button
                  key={q}
                  size="small"
                  shape="round"
                  style={{ fontSize: 12, color: "#1e3a8a", borderColor: "#bfdbfe", background: "#eff6ff" }}
                  onClick={() => handleSendQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ padding: 12, borderTop: "1px solid #e2e8f0", backgroundColor: "#fff", display: "flex", gap: 8 }}>
            <Input
              placeholder="Ask a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={() => handleSendQuestion()}
              style={{ borderRadius: 20 }}
            />
            <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={() => handleSendQuestion()} style={{ background: "#1e3a8a" }} />
          </div>
        </div>
      )}
    </>
  );
}
