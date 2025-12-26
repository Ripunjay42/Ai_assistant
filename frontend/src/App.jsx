import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Chat from './pages/Chat'
import AuthModal from './components/auth/AuthModal'

export default function App() {
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
