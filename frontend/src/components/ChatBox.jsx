import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Trash2, UploadCloud, Send, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// -------------------- Toast Component --------------------
const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!show) return null;

  const bgColor =
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    'bg-blue-500';

  return (
    <div className={`fixed top-5 right-5 px-4 py-2 rounded text-white shadow-lg ${bgColor} z-50`}>
      {message}
    </div>
  );
};

// -------------------- Tab Switcher --------------------
const Tabs = ({ activeTab, setActiveTab }) => (
  <div className="flex border-b border-gray-200 mb-6">
    {['ask', 'docs'].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`py-2 px-4 font-semibold ${
          activeTab === tab
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {tab === 'ask' ? 'Ask Question' : 'Upload / Documents'}
      </button>
    ))}
  </div>
);

// -------------------- ChatBox Component --------------------
const ChatBox = ({ messages, setMessages }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(scrollToBottom, [messages]);

  // Initialize voice recognition once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const startListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setListening(true);
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };
    recognition.onend = () => setListening(false);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const q = question;
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/ask`, { question: q });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.answer || 'No answer found' },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Failed to get answer' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-20">
            Ask a question about your PDFs...
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            
<div
  className={`px-4 py-2 rounded-lg shadow-sm whitespace-pre-wrap leading-snug max-w-[80%] ${
    msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 text-gray-900'
  }`}
>
  <ReactMarkdown
    components={{
      // Render everything as a span to remove paragraph spacing
      p: ({ node, ...props }) => <span {...props} />,
      h1: ({ node, ...props }) => <span className="font-bold text-lg" {...props} />,
      h2: ({ node, ...props }) => <span className="font-semibold text-md" {...props} />,
      li: ({ node, ...props }) => <span className="list-disc ml-4 block" {...props} />,
      // optional: remove strong spacing
      strong: ({ node, ...props }) => <strong {...props} />,
    }}
  >
    {msg.content}
  </ReactMarkdown>
</div>

          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t flex gap-2 items-center">
        <textarea
          rows={1}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question..."
          className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          onClick={startListening}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center"
        >
          <Mic className={`w-5 h-5 ${listening ? 'animate-pulse' : ''}`} />
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

// -------------------- Docs Manager --------------------
const DocRow = ({ doc, onDelete }) => (
  <tr>
    <td className="px-4 py-2">{doc.filename}</td>
    <td className="px-4 py-2 flex gap-2">
      <button
        onClick={() => onDelete(doc.docId)}
        className="text-red-600 font-semibold hover:text-red-800 flex items-center gap-1"
      >
        <Trash2 size={16} /> Delete
      </button>
    </td>
  </tr>
);

const DocsManager = ({ docs, setDocs, fetchDocs, showToast }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return showToast('Select a PDF first', 'error');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('PDF uploaded successfully!', 'success');
      setFile(null);
      fetchDocs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/docs/${docId}`);
      showToast('Document deleted successfully!', 'success');
      fetchDocs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`py-2 px-4 rounded-md text-white font-semibold ${
            uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 flex items-center gap-1'
          }`}
        >
          {uploading ? 'Uploading...' : <><UploadCloud size={18} /> Upload</>}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Filename</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {docs.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
                  No documents uploaded yet.
                </td>
              </tr>
            ) : (
              docs.map((doc) => <DocRow key={doc.docId} doc={doc} onDelete={handleDelete} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------- Main PdfManager --------------------
export default function PdfManager() {
  const [activeTab, setActiveTab] = useState('ask');
  const [messages, setMessages] = useState([]);
  const [docs, setDocs] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type) => setToast({ message: msg, type });

  const fetchDocs = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/docs`);
      setDocs(res.data.docs || []);
    } catch (err) {
      showToast('Failed to fetch documents', 'error');
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'ask' ? (
        <ChatBox messages={messages} setMessages={setMessages} />
      ) : (
        <DocsManager docs={docs} setDocs={setDocs} fetchDocs={fetchDocs} showToast={showToast} />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
