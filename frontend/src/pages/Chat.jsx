import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { BackgroundBeamsWithCollision } from "../components/ui/background-beams-with-collision";

export default function Chat() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Grid background */}
      <div className="fixed inset-0 grid-background pointer-events-none" />
      
      {/* Animated beams with collision */}
      {/* <BackgroundBeamsWithCollision /> */}
      
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
