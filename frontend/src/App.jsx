import ChatBox from './components/ChatBox';
export default function App() {

  return (
<div className="container max-w-[900px] mx-auto mt-10 p-6 font-sans rounded-xl shadow-lg 
                bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300">
  <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-blue-900">
    <img 
      src="/favicon-32x32.png" 
      alt="AI DocuMate Logo" 
      className="w-8 h-8"
    />
    AI DocuMate
  </h1>
  <ChatBox />
</div>


  );
}
