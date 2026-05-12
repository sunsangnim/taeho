import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { useWallet } from './hooks/useWallet';
import { getReadContract } from './utils/providers';
import './App.css';

function AppContent() {
  const { account } = useWallet();
  const [isAdmin, setIsAdmin] = useState(null);

  // 관리자 여부 확인: 연결된 지갑 주소 vs 컨트랙트 owner()
  useEffect(() => {
    if (!account) {
      setIsAdmin(null);
      return;
    }
    getReadContract().then((contract) => {
      if (!contract) return;
      contract.owner()
        .then((owner) => {
          setIsAdmin(owner.toLowerCase() === account.toLowerCase());
        })
        .catch(() => setIsAdmin(false));
    });
  }, [account]);

  // 누적 테스트: 콘솔에서 컨트랙트 및 백엔드 연결 확인
  useEffect(() => {
    if (!account) return;
    getReadContract().then((contract) => {
      if (!contract) return;
      contract.getElectionStatus()
        .then((status) => console.log('[Phase3 Test] getElectionStatus():', Number(status)))
        .catch(console.error);
    });
    fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/health`)
      .then((r) => r.json())
      .then((data) => console.log('[Phase3 Test] /api/health:', data))
      .catch(console.error);
  }, [account]);

  return (
    <>
      <Header isAdmin={isAdmin} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin isAdmin={isAdmin} />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
