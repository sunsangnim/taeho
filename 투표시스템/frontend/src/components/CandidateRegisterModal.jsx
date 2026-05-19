import { useState, useRef } from 'react';
import { getWriteContract } from '../utils/providers';
import { parseTxError } from '../utils/txError';
import { BACKEND_URL } from '../contract';
import './CandidateRegisterModal.css';

const STEP = {
  FORM: 'form',
  CONTRACT: 'contract',   // addCandidate() 트랜잭션
  UPLOAD: 'upload',       // 백엔드 사진 업로드
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function CandidateRegisterModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [step, setStep] = useState(STEP.FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  function handleFileSelect(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      setErrorMsg('jpg 또는 png 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    setErrorMsg('');
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setErrorMsg('이름을 입력해 주세요.');
      return;
    }
    setErrorMsg('');

    // ── 1단계: 컨트랙트 addCandidate() 호출 ──────────
    setStep(STEP.CONTRACT);
    let contractId;
    try {
      const contract = await getWriteContract();
      if (!contract) throw new Error('지갑이 연결되어 있지 않습니다.');

      const tx = await contract.addCandidate(name.trim());
      const receipt = await tx.wait();

      // CandidateAdded 이벤트에서 contractId 획득
      const event = receipt.logs
        .map((log) => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((e) => e && e.name === 'CandidateAdded');

      if (!event) throw new Error('CandidateAdded 이벤트를 찾을 수 없습니다.');
      contractId = Number(event.args.id);
    } catch (err) {
      const msg = parseTxError(err);
      if (msg === null) { setStep(STEP.FORM); return; } // 사용자 거부
      setErrorMsg(msg);
      setStep(STEP.ERROR);
      return;
    }

    // ── 2단계: 백엔드 POST /api/candidates ───────────
    setStep(STEP.UPLOAD);
    try {
      const formData = new FormData();
      formData.append('contractId', contractId);
      formData.append('name', name.trim());
      if (photoFile) formData.append('photo', photoFile);

      const res = await fetch(`${BACKEND_URL}/api/candidates`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || '서버 업로드 실패');
      }
    } catch (err) {
      // 백엔드 실패는 컨트랙트 등록 후이므로 경고만 표시하고 성공 처리
      console.warn('백엔드 업로드 실패 (사진 없이 등록됨):', err.message);
    }

    setStep(STEP.SUCCESS);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 900);
  }

  const isBusy = step === STEP.CONTRACT || step === STEP.UPLOAD;

  return (
    <div className="modal-overlay" onClick={!isBusy ? onClose : undefined}>
      <div className="reg-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="reg-modal-header">
          <h2>후보자 등록</h2>
          {!isBusy && <button className="modal-close-btn" onClick={onClose}>✕</button>}
        </div>

        {/* 이름 입력 */}
        <label className="reg-label">후보자 이름 *</label>
        <input
          className="reg-input"
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isBusy}
        />

        {/* 사진 업로드 */}
        <label className="reg-label">후보자 사진 <span className="optional">(선택)</span></label>
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isBusy && fileInputRef.current.click()}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="미리보기" className="preview-img" />
          ) : (
            <>
              <div className="drop-icon">📁</div>
              <div>파일 선택 또는 여기에 드래그</div>
              <div className="drop-hint">jpg, png 허용 / 최대 5MB</div>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
        {previewUrl && (
          <button
            className="remove-photo-btn"
            onClick={() => { setPhotoFile(null); setPreviewUrl(null); }}
            disabled={isBusy}
          >
            사진 제거
          </button>
        )}

        {/* 상태 메시지 */}
        {step === STEP.CONTRACT && (
          <p className="reg-status">MetaMask 서명 팝업을 확인해 주세요... <span className="mini-spinner" /></p>
        )}
        {step === STEP.UPLOAD && (
          <p className="reg-status">사진 업로드 중... <span className="mini-spinner" /></p>
        )}
        {step === STEP.SUCCESS && (
          <p className="reg-status success">✅ 후보자 등록 완료!</p>
        )}
        {step === STEP.ERROR && errorMsg && (
          <p className="reg-status error">❌ {errorMsg}</p>
        )}
        {step === STEP.FORM && errorMsg && (
          <p className="reg-status error">{errorMsg}</p>
        )}

        {/* 버튼 */}
        {step !== STEP.SUCCESS && (
          <div className="reg-actions">
            <button className="btn-cancel" onClick={onClose} disabled={isBusy}>취소</button>
            <button className="btn-register" onClick={handleSubmit} disabled={isBusy}>
              {isBusy ? <span className="mini-spinner white" /> : '등록하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
