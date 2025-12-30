import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";

export default function Chat() {
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        {/* Centered chat container */}
        <div className="flex-1 flex justify-center items-center overflow-hidden py-4">
          <div className="w-full max-w-4xl h-[85vh] flex flex-col">
            <ChatWindow />
          </div>
        </div>
      </div>
    </div>
  );
}
