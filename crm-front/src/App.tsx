import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import Documents from './pages/Documents';
import Accounting from './pages/Accounting';
import CashBank from './pages/CashBank';

function App() {
  return (
    <Router>
       <Routes>
        <Route path="/" element={<Layout />} >
          <Route index element={<Dashboard/>} />
          <Route path="customers" element={<Customers/>} />
          <Route path="products" element={<Products/>} />
          <Route path="orders" element={<Orders/>} />
          <Route path="assistant" element={<Assistant/>} />
          <Route path="documents" element={<Documents/>} />
          <Route path="accounting" element={<Accounting/>} />
          <Route path="cashbank" element={<CashBank/>} />
        </Route>
       </Routes>
    </Router>
  )
}

export default App
