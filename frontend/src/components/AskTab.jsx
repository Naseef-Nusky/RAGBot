import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AskTab = ({ token }) => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  // Speech Recognition setup
  const recognition = useRef(null);
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false;
    recognition.current.lang = 'en-US';

    recognition.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion((prev) => prev + ' ' + transcript);
    };

    recognition.current.onend = () => {
      setListening(false);
    };
  }, []);

  const handleMicClick = () => {
    if (!recognition.current) return;
    if (listening) {
      recognition.current.stop();
    } else {
      setListening(true);
      recognition.current.start();
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const q = question;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/docs/ask`,
        { question: q },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer || 'No answer found' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to get answer' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-20">Ask a question about your PDFs...</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`px-4 py-2 rounded-lg shadow-sm whitespace-pre-wrap leading-snug max-w-[80%] ${
                msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 text-gray-900'
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t flex gap-2 items-center">
        <textarea
          rows={1}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question..."
          className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          onClick={handleMicClick}
          className={`px-3 py-2 rounded-lg border ${listening ? 'bg-red-500 text-white' : 'bg-white text-gray-700'} hover:bg-gray-100 flex items-center justify-center`}
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          onClick={handleAsk}
          disabled={loading}
          className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center`}
        >
          <Send className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default AskTab;
