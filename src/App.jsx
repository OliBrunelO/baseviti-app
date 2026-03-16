import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Admin from './pages/Admin'
import SetPassword from './pages/SetPassword'
import AdminStructure from './pages/AdminStructure'
import AdminDashboard from './pages/AdminDashboard'
import SaisieTravail from './pages/SaisieTravail'
import MesTravaux from './pages/MesTravaux'
import AdminUsers from './pages/AdminUsers'

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/structure" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminStructure />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/saisie" 
            element={
              <ProtectedRoute>
                <SaisieTravail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mes-travaux" 
            element={
              <ProtectedRoute>
                <MesTravaux />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminUsers />
              </ProtectedRoute>
              } 
          />

        </Routes>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App