import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PuraDetail from './pages/PuraDetail';
import ApplyAdmin from './pages/ApplyAdmin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pura/:id" element={<PuraDetail />} />
          <Route path="apply-admin" element={<ApplyAdmin />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
