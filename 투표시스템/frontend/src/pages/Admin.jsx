import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useElectionStatus, STATUS } from '../hooks/useElectionStatus';
import { getReadContract, getWriteContract } from '../utils/providers';
import { parseTxError } from '../utils/txError';
import { BACKEND_URL } from '../contract';
import CandidateRegisterModal from '../components/CandidateRegisterModal';
import './Admin.css';

export default function Admin({ isAdmin }) {
  const navigate = useNavigate();
  const { account } = useWallet();
  const { status, loading: statusLoading } = useElectionStatus();

  const [candidates, setCandidates] = useState([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [electionLoading, setElectionLoading] = useState(false);
  const [electionError, setElectionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // ── 라우트 가드 ────────────────────────────────
  useEffect(() => {
    if (isAdmin === false) {
      alert('접근 권한이 없습니다.');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // ── 후보자 목록 로드 ───────────────────────────
  const loadCandidates = useCallback(async () => {
    try {
      const contract = await getReadContract();
      if (!contract) return;
      const contractData = await contract.getCandidates();

      let backendMap = {};
      try {
        const res = await fetch(`${BACKEND_URL}/api/candidates`);
        if (res.ok) {
          const list = await res.json();
          list.forEach((c) => { backendMap[c.contractId] = c.photoUrl; });
        }
      } catch { /* 백엔드 오류 무시 */ }

      setCandidates(contractData.map((c) => ({
        id: Number(c.id),
        name: c.name,
        voteCount: Number(c.voteCount),
        photoUrl: backendMap[Number(c.id)] || null,
      })));
    } catch { /* 무시 */ }
  }, []);

  useEffect(() => { loadCandidates(); }, [loadCandidates]);

  // ── 선거 시작 ──────────────────────────────────
  async function handleStartVoting() {
    setElectionLoading(true);
    setElectionError('');
    try {
      const contract = await getWriteContract();
      const tx = await contract.startVoting();
      await tx.wait();
    } catch (err) {
      const msg = parseTxError(err);
      if (msg) setElectionError(msg);
    } finally {
      setElectionLoading(false);
    }
  }

  // ── 선거 종료 ──────────────────────────────────
  async function handleEndVoting() {
    setElectionLoading(true);
    setElectionError('');
    try {
      const contract = await getWriteContract();
      const tx = await contract.endVoting();
      await tx.wait();
    } catch (err) {
      const msg = parseTxError(err);
      if (msg) setElectionError(msg);
    } finally {
      setElectionLoading(false);
    }
  }

  // ── 후보자 삭제 ────────────────────────────────
  async function handleDelete(candidate) {
    if (!window.confirm(`"${candidate.name}"을(를) 삭제하시겠습니까?`)) return;
    setDeletingId(candidate.id);
    try {
      // 1. 컨트랙트 removeCandidate()
      const contract = await getWriteContract();
      const tx = await contract.removeCandidate(candidate.id);
      await tx.wait();

      // 2. 백엔드 삭제
      await fetch(`${BACKEND_URL}/api/candidates/${candidate.id}`, { method: 'DELETE' });

      await loadCandidates();
    } catch (err) {
      const msg = parseTxError(err);
      if (msg) alert(msg);
    } finally {
      setDeletingId(null);
    }
  }

  // 선거 시작 버튼 비활성화 조건
  const canStart = candidates.length >= 2 && status === STATUS.READY && !electionLoading;

  if (!account || isAdmin === null) {
    return <div className="admin-loading">로딩 중...</div>;
  }
  if (isAdmin === false) return null;
  if (statusLoading) return <div className="admin-loading">로딩 중...</div>;

  const isReady = status === STATUS.READY;
  const isActive = status === STATUS.ACTIVE;
  const isEnded = status === STATUS.ENDED;

  const statusLabel = isReady ? '준비 중' : isActive ? '진행 중' : '종료';

  return (
    <div className="admin-page">
      <h1 className="admin-title">관리자 패널</h1>

      {/* ── 선거 상태 관리 ── */}
      <section className="admin-section">
        <h2>선거 상태 관리</h2>
        <p className="status-text">
          현재 상태: <strong>{statusLabel}</strong>
          {isActive && <span> | 총 투표 수: {candidates.reduce((s, c) => s + c.voteCount, 0)}</span>}
        </p>

        {electionError && <p className="admin-error">❌ {electionError}</p>}

        {isReady && (
          <div className="election-btn-wrap">
            <button
              className="btn-start"
              onClick={handleStartVoting}
              disabled={!canStart}
            >
              {electionLoading ? '처리 중...' : '▶ 선거 시작'}
            </button>
            {candidates.length < 2 && (
              <p className="hint">후보자가 최소 2명 이상이어야 합니다.</p>
            )}
          </div>
        )}

        {isActive && (
          <button
            className="btn-end"
            onClick={handleEndVoting}
            disabled={electionLoading}
          >
            {electionLoading ? '처리 중...' : '■ 선거 종료'}
          </button>
        )}

        {isEnded && <p className="ended-msg">선거가 종료되었습니다.</p>}
      </section>

      {/* ── 후보자 관리 ── */}
      <section className="admin-section">
        <div className="section-header">
          <h2>후보자 관리</h2>
          <button
            className="btn-add"
            onClick={() => setShowRegModal(true)}
            disabled={!isReady}
            title={!isReady ? '선거 시작 후에는 등록할 수 없습니다.' : ''}
          >
            + 후보자 등록
          </button>
        </div>

        {!isReady && <p className="hint">선거 시작 후에는 후보자 등록 및 삭제가 불가합니다.</p>}

        {candidates.length === 0 ? (
          <p className="empty-msg">등록된 후보자가 없습니다.</p>
        ) : (
          <table className="candidate-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>사진</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="thumb" />
                    ) : (
                      <span className="no-photo">없음</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(c)}
                      disabled={!isReady || deletingId === c.id}
                    >
                      {deletingId === c.id ? '삭제 중...' : '삭제'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 후보자 등록 모달 */}
      {showRegModal && (
        <CandidateRegisterModal
          onClose={() => setShowRegModal(false)}
          onSuccess={loadCandidates}
        />
      )}
    </div>
  );
}
