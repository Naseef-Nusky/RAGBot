import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Trash2, UploadCloud } from 'lucide-react';

// Toast Component
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
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-5 right-5 px-4 py-2 rounded text-white shadow-lg ${bgColor} z-50`}>
      {message}
    </div>
  );
};

// Document Row
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

const DocsTab = ({ token }) => {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type) => setToast({ message: msg, type });

  const fetchDocs = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/docs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(res.data.docs || []);
    } catch {
      showToast('Failed to fetch documents', 'error');
    }
  }, [token]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async () => {
    if (!file) return showToast('Select a PDF first', 'error');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/docs/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      showToast('PDF uploaded successfully!', 'success');
      setFile(null);
      fetchDocs();
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async docId => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/docs/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast('Document deleted!', 'success');
      fetchDocs();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={uploading} className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
          {uploading ? 'Uploading...' : <><UploadCloud size={18} /> Upload</>}
        </button>
      </div>

      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Filename</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-4 text-center text-gray-500">No documents uploaded yet.</td>
            </tr>
          ) : (
            docs.map(doc => <DocRow key={doc.docId} doc={doc} onDelete={handleDelete} />)
          )}
        </tbody>
      </table>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default DocsTab;
