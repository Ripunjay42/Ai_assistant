import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Chat from './pages/Chat'
import AuthModal from './components/auth/AuthModal'
import { useAuthStore } from './store/auth.store'
import { useChatStore } from './store/chat.store'

export default function App() {
  const user = useAuthStore((s) => s.user);

  // Initialize chat store with current user on app load
  useEffect(() => {
    if (user?.id) {
      // Set current user ID and re-hydrate chat store
      localStorage.setItem("currentUserId", user.id);
      useChatStore.persist.rehydrate();
    } else {
      // If no user is logged in, remove current user ID
      localStorage.removeItem("currentUserId");
    }
  }, [user?.id]);

  return (
    <BrowserRouter>
      {/* Global Auth Modal */}
      <AuthModal />
      
      <Routes>
        {/* Chat is the default page - auth modal shown when trying to chat without login */}
        <Route path="/" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}
