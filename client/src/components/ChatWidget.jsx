import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button, Form, Spinner } from 'react-bootstrap';
import axiosClient from '../api/axiosClient';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! I am your AI Tribal Affairs Scholarship Assistant. How can I assist you today with schemes, rules, or document requirements?',
      source: 'MoTA Automated Helpdesk',
      suggestions: [
        'Which schemes can I apply for?',
        'What documents do I need for NOS?',
        'What is the status of my application?',
        'Am I eligible for NFST?'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    // Append user message
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/chatbot/message', { message: text });
      if (res.data.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: res.data.reply,
            source: res.data.source,
            suggestions: res.data.suggestions || []
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Unable to reach the helpdesk server. Please check your network connection.',
          source: 'System Error',
          suggestions: ['Try again']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div
        className="chat-floating-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Scholarship AI Assistant"
      >
        {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="gov-header-bg p-3 text-white d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-warning text-dark rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                <Bot size={18} />
              </div>
              <div>
                <div className="fw-bold fs-6" style={{ lineHeight: '1.2' }}>Scholarship Assistant</div>
                <div className="small text-white-50" style={{ fontSize: '0.72rem' }}>Offline Knowledge Grounded</div>
              </div>
            </div>
            <button
              className="btn btn-sm text-white p-0"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="p-3 flex-grow-1 overflow-auto bg-light" style={{ fontSize: '0.86rem' }}>
            {messages.map((msg, index) => (
              <div key={index} className={`d-flex flex-column mb-3 ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                <div
                  className={`p-2.5 rounded-3 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white text-dark border'
                  }`}
                  style={{ maxWidth: '85%', whiteSpace: 'pre-wrap', lineHeight: '1.45' }}
                >
                  {msg.text}
                </div>

                {/* Source Citation */}
                {msg.source && (
                  <div className="small text-muted mt-1 px-1" style={{ fontSize: '0.68rem' }}>
                    <Sparkles size={10} className="me-1 text-warning" />
                    Source: <em>{msg.source}</em>
                  </div>
                )}

                {/* Suggestion Pills */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="d-flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        className="btn btn-outline-primary btn-sm py-0.5 px-2 rounded-pill small"
                        style={{ fontSize: '0.74rem' }}
                        onClick={() => handleSendMessage(sug)}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="d-flex align-items-center gap-2 text-muted small py-2">
                <Spinner size="sm" animation="grow" variant="primary" />
                <span>Consulting scheme database…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-2 border-top bg-white">
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="d-flex gap-2"
            >
              <Form.Control
                type="text"
                placeholder="Ask about schemes, status, rules..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                size="sm"
                className="rounded-pill"
              />
              <Button
                type="submit"
                variant="gov-primary"
                size="sm"
                className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                disabled={!inputText.trim() || loading}
                style={{ width: '34px', height: '34px' }}
              >
                <Send size={15} />
              </Button>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
