import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Writings from './pages/Writings'
import WritingDetail from './pages/WritingDetail'
import Fragments from './pages/Fragments'
import FragmentDetail from './pages/FragmentDetail'
import VisualStories from './pages/VisualStories'
import VisualStoryDetail from './pages/VisualStoryDetail'
import About from './pages/About'
import Admin from './pages/Admin'

// Use a sentinel that can never be matched by an empty URL segment
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || '__unset__'

function AdminGuard() {
  const { secretKey } = useParams()
  if (!import.meta.env.VITE_ADMIN_KEY || secretKey !== ADMIN_KEY) {
    return <Navigate to="/" replace />
  }
  return <Admin />
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/writings" element={<Writings />} />
        <Route path="/writings/:id" element={<WritingDetail />} />
        <Route path="/fragments" element={<Fragments />} />
        <Route path="/fragments/:id" element={<FragmentDetail />} />
        <Route path="/visual-stories" element={<VisualStories />} />
        <Route path="/visual-stories/:id" element={<VisualStoryDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin/:secretKey" element={<AdminGuard />} />
      </Route>
    </Routes>
  )
}

export default App
