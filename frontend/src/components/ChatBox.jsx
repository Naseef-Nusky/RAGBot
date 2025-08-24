// import { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import { Trash2, UploadCloud, Send } from 'lucide-react';

// // Tab Switcher
// const Tabs = ({ activeTab, setActiveTab }) => (
//   <div className="flex border-b border-gray-200 mb-6">
//     {['ask', 'docs'].map((tab) => (
//       <button
//         key={tab}
//         onClick={() => setActiveTab(tab)}
//         className={`py-2 px-4 font-semibold ${
//           activeTab === tab
//             ? 'border-b-2 border-blue-600 text-blue-600'
//             : 'text-gray-500 hover:text-gray-700'
//         }`}
//       >
//         {tab === 'ask' ? 'Ask Question' : 'Upload / Documents'}
//       </button>
//     ))}
//   </div>
// );

// // ChatBox Component
// const ChatBox = ({ messages, setMessages }) => {
//   const [question, setQuestion] = useState('');
//   const [loading, setLoading] = useState(false);
//   const chatEndRef = useRef(null);

//   const scrollToBottom = () =>
//     chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

//   useEffect(scrollToBottom, [messages]);

//   const handleAsk = async () => {
//     if (!question.trim()) return;
//     setMessages((prev) => [...prev, { type: 'user', text: question }]);
//     const q = question;
//     setQuestion('');
//     setLoading(true);

//     try {
//       const res = await axios.post('http://localhost:5000/api/ask', { question: q });
//       setMessages((prev) => [
//         ...prev,
//         { type: 'ai', text: res.data.answer || 'No answer found' },
//       ]);
//     } catch {
//       setMessages((prev) => [...prev, { type: 'ai', text: 'Failed to get answer' }]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleAsk();
//     }
//   };

//   return (
//     <div className="bg-white shadow-lg rounded-lg p-4 flex flex-col h-[700px]">
//       <div className="flex-1 overflow-y-auto mb-4 space-y-3">
//         {messages.length === 0 && (
//           <p className="text-gray-500 text-center mt-20">
//             Ask a question about your PDFs...
//           </p>
//         )}
//         {messages.map((msg, idx) => (
//           <div
//             key={idx}
//             className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
//           >
//             <div
//               className={`rounded-lg p-3 max-w-[80%] whitespace-pre-wrap ${
//                 msg.type === 'user'
//                   ? 'bg-blue-600 text-white'
//                   : 'bg-gray-100 text-gray-800'
//               }`}
//             >
//               {msg.text}
//             </div>
//           </div>
//         ))}
//         <div ref={chatEndRef} />
//       </div>
//       <div className="flex items-center gap-2">
//         <textarea
//           rows={2}
//           placeholder="Type your question..."
//           value={question}
//           onChange={(e) => setQuestion(e.target.value)}
//           onKeyDown={handleKeyDown}
//           className="flex-1 border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
//         />
//         <button
//           onClick={handleAsk}
//           disabled={loading}
//           className={`px-4 py-4 rounded-md text-white font-semibold ${
//             loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
//           }`}
//         >
//           {loading ? '...' : <Send size={20} />}
//         </button>
//       </div>
//     </div>
//   );
// };

// // Individual Document Row
// const DocRow = ({ doc, onDelete }) => (
//   <tr>
//     <td className="px-4 py-2">{doc.filename}</td>
//     <td className="px-4 py-2 flex gap-2">
//       <button
//         onClick={() => onDelete(doc.docId)}
//         className="text-red-600 font-semibold hover:text-red-800 flex items-center gap-1"
//       >
//         <Trash2 size={16} /> Delete
//       </button>
//     </td>
//   </tr>
// );

// // Docs Manager
// const DocsManager = ({ docs, setDocs, fetchDocs }) => {
//   const [file, setFile] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   const handleUpload = async () => {
//     if (!file) return alert('Select a PDF first');
//     setUploading(true);
//     try {
//       const formData = new FormData();
//       formData.append('file', file);
//       await axios.post('http://localhost:5000/api/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       alert('PDF uploaded successfully!');
//       setFile(null);
//       fetchDocs(); // Refresh list after upload
//     } catch (err) {
//       alert(err.response?.data?.error || 'Upload failed');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDelete = async (docId) => {
//     if (!window.confirm('Are you sure you want to delete this document?')) return;
//     try {
//       await axios.delete(`http://localhost:5000/api/docs/${docId}`);
//       fetchDocs(); // Refresh after deletion
//     } catch (err) {
//       alert(err.response?.data?.error || 'Delete failed');
//     }
//   };

//   return (
//     <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
//       {/* Upload section */}
//       <div className="flex items-center gap-4">
//         <input
//           type="file"
//           accept="application/pdf"
//           onChange={(e) => setFile(e.target.files[0])}
//           className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <button
//           onClick={handleUpload}
//           disabled={uploading}
//           className={`py-2 px-4 rounded-md text-white font-semibold ${
//             uploading
//               ? 'bg-gray-400 cursor-not-allowed'
//               : 'bg-blue-600 hover:bg-blue-700 flex items-center gap-1'
//           }`}
//         >
//           {uploading ? 'Uploading...' : <><UploadCloud size={18} /> Upload</>}
//         </button>
//       </div>

//       {/* Documents Table */}
//       <div className="overflow-x-auto">
//         <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Filename</th>
//               <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {docs.length === 0 ? (
//               <tr>
//                 <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
//                   No documents uploaded yet.
//                 </td>
//               </tr>
//             ) : (
//               docs.map((doc) => <DocRow key={doc.docId} doc={doc} onDelete={handleDelete} />)
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// // Main PdfManager
// export default function PdfManager() {
//   const [activeTab, setActiveTab] = useState('ask');
//   const [messages, setMessages] = useState([]);
//   const [docs, setDocs] = useState([]);

//   // Fetch all documents immediately on page load
//   const fetchDocs = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/docs');
//       setDocs(res.data.docs || []);
//     } catch (err) {
//       console.error('Failed to fetch documents:', err);
//     }
//   };

//   useEffect(() => {
//     fetchDocs();
//   }, []);

//   return (
//     <div className="max-w-4xl mx-auto mt-8">
//       <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
//       {activeTab === 'ask' ? (
//         <ChatBox messages={messages} setMessages={setMessages} />
//       ) : (
//         <DocsManager docs={docs} setDocs={setDocs} fetchDocs={fetchDocs} />
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Trash2, UploadCloud, Send } from 'lucide-react';

// -------------------- Toast Component --------------------
const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onClose && onClose();
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
  const chatEndRef = useRef(null);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(scrollToBottom, [messages]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { type: 'user', text: question }]);
    const q = question;
    setQuestion('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/ask', { question: q });
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: res.data.answer || 'No answer found' },
      ]);
    } catch {
      setMessages((prev) => [...prev, { type: 'ai', text: 'Failed to get answer' }]);
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
    <div className="bg-white shadow-lg rounded-lg p-4 flex flex-col h-[700px]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-20">
            Ask a question about your PDFs...
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg p-3 max-w-[80%] whitespace-pre-wrap ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex items-center gap-2">
        <textarea
          rows={2}
          placeholder="Type your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className={`px-4 py-4 rounded-md text-white font-semibold ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? '...' : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};

// -------------------- Individual Document Row --------------------
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

// -------------------- Docs Manager --------------------
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
      await axios.delete(`http://localhost:5000/api/docs/${docId}`);
      showToast('Document deleted successfully!', 'success');
      fetchDocs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
      {/* Upload section */}
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

      {/* Documents Table */}
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

  // Fetch all documents immediately on page load
  const fetchDocs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/docs');
      setDocs(res.data.docs || []);
    } catch (err) {
      showToast('Failed to fetch documents', 'error');
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const showToast = (msg, type) => setToast({ message: msg, type });

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'ask' ? (
        <ChatBox messages={messages} setMessages={setMessages} />
      ) : (
        <DocsManager docs={docs} setDocs={setDocs} fetchDocs={fetchDocs} showToast={showToast} />
      )}

      {/* Toast popup */}
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

