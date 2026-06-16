import { useState } from 'react';
import { getWriteContract } from '../utils/providers';
import { parseTxError } from '../utils/txError';
import './VoteModal.css';

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23e0e0e0"/><text x="50%25" y="54%25" text-anchor="middle" dominant-baseline="middle" font-size="48" fill="%23999">👤</text></svg>';

// 트랜잭션 진행 단계
const STEP = {
  CONFIRM: 'confirm',   // 확인 대기
  SIGNING: 'signing',   // MetaMask 서명 팝업
  PENDING: 'pending',   // 블록 확인 대기
  SUCCESS: 'success',   // 완료
  ERROR: 'error',       // 오류
};

export default function VoteModal({ candidate, account, onClose, onSuccess }) {
  const [step, setStep] = useState(STEP.CONFIRM);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleVote() {
    setStep(STEP.SIGNING);
    setErrorMsg('');

    try {
      const contract = await getWriteContract();
      if (!contract) throw new Error('지갑이 연결되어 있지 않습니다.');

      // 트랜잭션 제출 — candidateId는 배열 인덱스가 아닌 컨트랙트 id 필드값
      const tx = await contract.vote(candidate.id);
      setStep(STEP.PENDING);

      // 블록 확인 대기
      await tx.wait();
      setStep(STEP.SUCCESS);

      // 성공 후 1.2초 뒤 모달 닫고 데이터 갱신
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      const msg = parseTxError(err);
      if (msg === null) {
        // 사용자 거부 → 모달 유지, 조용히 CONFIRM 상태로 복귀
        setStep(STEP.CONFIRM);
      } else {
        setErrorMsg(msg);
        setStep(STEP.ERROR);
      }
    }
  }

  const isBusy = step === STEP.SIGNING || step === STEP.PENDING;

  return (
    <div className="modal-overlay" onClick={!isBusy ? onClose : undefined}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="modal-header">
          <h2>투표하시겠습니까?</h2>
          {!isBusy && (
            <button className="modal-close" onClick={onClose}>✕</button>
          )}
        </div>

        {/* 후보자 정보 */}
        <div className="modal-candidate">
          <img
            src={candidate.photoUrl || DEFAULT_AVATAR}
            alt={candidate.name}
            className="modal-photo"
            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
          />
          <div className="modal-name">{candidate.name}</div>
        </div>

        {/* 경고 */}
        <p className="modal-warning">
          ⚠ 투표는 블록체인에 영구 기록되며 취소하거나 변경할 수 없습니다.
        </p>

        {/* 지갑 주소 */}
        <p className="modal-wallet">
          내 지갑: <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '-'}</span>
        </p>

        {/* 진행 단계 표시 */}
        {step === STEP.SIGNING && (
          <p className="modal-status">MetaMask 서명 팝업을 확인해 주세요...</p>
        )}
        {step === STEP.PENDING && (
          <p className="modal-status">⏳ 처리 중... 블록 확인을 기다리고 있습니다.</p>
        )}
        {step === STEP.SUCCESS && (
          <p className="modal-status success">✅ 투표 완료!</p>
        )}
        {step === STEP.ERROR && (
          <p className="modal-status error">❌ {errorMsg}</p>
        )}

        {/* 버튼 */}
        {step !== STEP.SUCCESS && (
          <div className="modal-actions">
            <button
              className="btn-cancel"
              onClick={onClose}
              disabled={isBusy}
            >
              취소
            </button>
            <button
              className="btn-vote"
              onClick={handleVote}
              disabled={isBusy}
            >
              {isBusy ? (
                <span className="spinner" />
              ) : (
                'MetaMask로 투표'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
