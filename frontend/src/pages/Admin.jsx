import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Phase 6에서 구현 예정
export default function Admin({ isAdmin }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin === false) {
      alert('접근 권한이 없습니다.');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (isAdmin === null || isAdmin === undefined) return null;

  return <div style={{ padding: '40px', textAlign: 'center' }}>관리자 패널 (Phase 6에서 구현)</div>;
}
