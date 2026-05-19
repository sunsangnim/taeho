import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import './Header.css';

function shortenAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Header({ isAdmin }) {
  const { account, isInstalled, isConnecting, isSepolia, connect, disconnect, switchToSepolia } =
    useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* MetaMask 미설치 배너 */}
      {!isInstalled && (
        <div className="metamask-banner">
          MetaMask가 설치되어 있지 않습니다.{' '}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noreferrer"
          >
            MetaMask 설치하기
          </a>
        </div>
      )}

      <header className="header">
        <Link to="/" className="header-logo">
          🗳 BlockVote
        </Link>

        <div className="header-right">
          {account && (
            <>
              {/* 네트워크 배지 */}
              {isSepolia ? (
                <span className="badge badge-green">Sepolia ●</span>
              ) : (
                <button className="badge badge-red" onClick={switchToSepolia}>
                  잘못된 네트워크 — Sepolia로 전환
                </button>
              )}

              {/* 관리자 패널 링크 */}
              {isAdmin && (
                <Link to="/admin" className="admin-link">
                  관리자 패널
                </Link>
              )}

              {/* 주소 드롭다운 */}
              <div className="dropdown" ref={dropdownRef}>
                <button
                  className="address-btn"
                  onClick={() => setDropdownOpen((o) => !o)}
                >
                  {shortenAddress(account)} ▼
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <button
                      onClick={() => {
                        disconnect();
                        setDropdownOpen(false);
                      }}
                    >
                      연결 해제
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!account && isInstalled && (
            <button className="connect-btn" onClick={connect} disabled={isConnecting}>
              {isConnecting ? '연결 중...' : 'MetaMask 연결'}
            </button>
          )}
        </div>
      </header>
    </>
  );
}
