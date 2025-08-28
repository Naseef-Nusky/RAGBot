import { useState } from 'react';
import AskTab from './AskTab';
import DocsTab from './DocsTab';

const Tabs = ({ activeTab, setActiveTab }) => (
  <div className="flex border-b border-gray-200 mb-6">
    {['ask', 'docs'].map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`py-2 px-4 font-semibold ${
          activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {tab === 'ask' ? 'Ask Question' : 'Upload / Documents'}
      </button>
    ))}
  </div>
);

export default function PdfManager({ token }) {
  const [activeTab, setActiveTab] = useState('ask');

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Keep both components mounted, just hide the inactive one */}
      <div className={activeTab === 'ask' ? 'block' : 'hidden'}>
        <AskTab token={token} />
      </div>
      <div className={activeTab === 'docs' ? 'block' : 'hidden'}>
        <DocsTab token={token} />
      </div>
    </div>
  );
}
