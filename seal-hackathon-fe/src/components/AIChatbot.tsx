"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Typography, Avatar, Tooltip } from 'antd';
import { MessageOutlined, CloseOutlined, MinusOutlined, SendOutlined, RobotOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

export default function AIChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [role, setRole] = useState(''); // default role empty
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check role in local storage
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            setIsLoggedIn(true);
            try {
                const user = JSON.parse(stored);
                if (user.role) {
                    setRole(user.role);
                }
            } catch (e) {}
        } else {
            setIsLoggedIn(false);
        }
    }
  }, []);

  const suggestedQuestions = [
    "Cách đăng ký tham gia",
    "Thể lệ cuộc thi",
    "Cơ cấu giải thưởng",
    "Tìm Mentor / Ghép nhóm"
  ];
  type MessageType = {
    id: number;
    sender: string;
    text: string;
    action?: { label: string; path: string } | null;
  };

  const defaultMessages: MessageType[] = [
    {
      id: 1,
      sender: 'bot',
      text: 'Chào bạn! Mình là trợ lý ảo AI của SEAL. Bạn cần hỗ trợ về "đăng ký", "thể lệ" hay "giải thưởng" nào?'
    }
  ];
  
  const [messages, setMessages] = useState<MessageType[]>(defaultMessages);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Chỉ hiển thị cho User thường đã đăng nhập
  if (!isLoggedIn || role === 'Admin') return null;

  const handleSendQuestion = (questionText?: string) => {
    const textToSend = questionText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue(''); 

    setTimeout(() => {
      const normalizedInput = removeAccents(userMessage.text);
      let botResponse = '';

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        action: null as {label: string, path: string} | null
      };

      if (normalizedInput.includes('dang ky') || normalizedInput.includes('tham gia')) {
        botMessage.text = 'Để đăng ký tham gia SEAL Hackathon, bạn có thể truy cập mục **My Team** để tạo nhóm mới hoặc vào **Matchmaking** để tìm đồng đội nhé!';
        botMessage.action = { label: 'Tạo nhóm ngay', path: '/dashboard/teams' };
      } 
      else if (normalizedInput.includes('the le') || normalizedInput.includes('noi quy') || normalizedInput.includes('quy che')) {
        botMessage.text = '📝 **Thể lệ cuộc thi:**\n1. Mỗi đội gồm 3-5 thành viên.\n2. Sản phẩm phải có tính thực tiễn cao.\n3. Nghiêm cấm mọi hành vi sao chép mã nguồn (Sẽ quét đạo văn).\n4. Nộp bài trước deadline hiển thị trên hệ thống.';
      }
      else if (normalizedInput.includes('giai thuong') || normalizedInput.includes('thuong') || normalizedInput.includes('tien')) {
        botMessage.text = '🏆 **Cơ cấu giải thưởng siêu khủng năm nay:**\n🥇 Giải Nhất: 20.000.000 VNĐ + Kỷ niệm chương\n🥈 Giải Nhì: 10.000.000 VNĐ\n🥉 Giải Ba: 5.000.000 VNĐ\nĐăng ký chiến ngay nào bạn ơi!';
        botMessage.action = { label: 'Xem Giải Thưởng', path: '/dashboard/prizes' };
      }
      else if (normalizedInput.includes('doi') || normalizedInput.includes('team') || normalizedInput.includes('nhom')) {
        botMessage.text = 'Bạn có thể xem và quản lý nhóm của mình tại mục **My Team**. Hệ thống cũng hỗ trợ ghép đội (Matchmaking) nếu bạn chưa có nhóm!';
        botMessage.action = { label: 'Đi tới Teams', path: '/dashboard/teams' };
      }
      else if (normalizedInput.includes('mentor') || normalizedInput.includes('huong dan') || normalizedInput.includes('giang vien')) {
        botMessage.text = 'Các Mentor sẽ được phân công hỗ trợ nhóm của bạn. Bạn có thể xem danh sách Mentor trong mục **My Team** nhé!';
      }
      else {
        botMessage.text = 'Xin lỗi, mình là AI Assistant của SEAL Hackathon. Mình không hiểu câu hỏi của bạn hoặc câu hỏi này không liên quan đến cuộc thi. Mình chỉ có thể hỗ trợ các thông tin về **Đăng ký**, **Thể lệ**, **Giải thưởng**, **Nhóm** và **Mentor**. Bạn vui lòng hỏi lại theo các chủ đề đó nhé!';
      }
      
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <>
      {!isOpen && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined style={{ fontSize: '24px' }} />}
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
            zIndex: 1000,
            background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)'
          }}
        />
      )}

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '350px',
          height: '500px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#3b82f6' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>SEAL AI Assistant</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Always online</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tooltip title="Thu gọn (Giữ lịch sử)">
                <Button 
                  type="text" 
                  icon={<MinusOutlined style={{ color: '#fff' }} />} 
                  onClick={() => setIsOpen(false)} 
                />
              </Tooltip>
              <Tooltip title="Đóng & Xóa trò chuyện">
                <Button 
                  type="text" 
                  icon={<CloseOutlined style={{ color: '#fff' }} />} 
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(() => setMessages(defaultMessages), 300);
                  }} 
                />
              </Tooltip>
            </div>
          </div>

          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '8px'
              }}>
                {msg.sender === 'bot' && <Avatar icon={<RobotOutlined />} size="small" style={{ backgroundColor: '#1e3a8a' }} />}
                
                <div style={{
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    backgroundColor: msg.sender === 'user' ? '#3b82f6' : '#fff',
                    color: msg.sender === 'user' ? '#fff' : '#334155',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                  }} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  
                  {msg.action && (
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<ArrowRightOutlined />}
                      onClick={() => {
                        router.push(msg.action!.path);
                        setIsOpen(false);
                      }}
                      style={{ alignSelf: 'flex-start', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '12px' }}
                    >
                      {msg.action.label}
                    </Button>
                  )}
                </div>
                
                {msg.sender === 'user' && <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#94a3b8' }} />}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '8px 12px',
            backgroundColor: '#fff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <style>
              {`
                .suggestions-container::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            <div className="suggestions-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {suggestedQuestions.map((q, idx) => (
                <Button 
                  key={idx} 
                  size="small" 
                  shape="round"
                  style={{ fontSize: '12px', color: '#1e3a8a', borderColor: '#bfdbfe', background: '#eff6ff' }}
                  onClick={() => handleSendQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#fff',
            display: 'flex',
            gap: '8px'
          }}>
            <Input 
              placeholder="Nhập câu hỏi..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={() => handleSendQuestion()}
              style={{ borderRadius: '20px' }}
            />
            <Button 
              type="primary" 
              shape="circle" 
              icon={<SendOutlined />} 
              onClick={() => handleSendQuestion()} 
              style={{ background: '#1e3a8a' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
