import './CandidateCard.css';

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23e0e0e0"/><text x="50%25" y="54%25" text-anchor="middle" dominant-baseline="middle" font-size="48" fill="%23999">👤</text></svg>';

/**
 * voteButtonState: 'hidden' | 'active' | 'voted' | 'disabled'
 *   hidden   — READY/ENDED 상태 (버튼 미표시)
 *   active   — ACTIVE + 미투표 + 지갑 연결 (클릭 가능)
 *   voted    — 이미 투표한 지갑 (✓ 투표 완료)
 *   disabled — 지갑 미연결 (툴팁 표시)
 */
export default function CandidateCard({
  candidate,
  showVotes = false,
  totalVotes = 0,
  isWinner = false,
  voteButtonState = 'hidden',
  onVote = null,
}) {
  const { name, voteCount, photoUrl } = candidate;
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <div className={`candidate-card ${isWinner ? 'winner' : ''}`}>
      {isWinner && <div className="winner-badge">🏆 당선자</div>}
      <img
        src={photoUrl || DEFAULT_AVATAR}
        alt={name}
        className="candidate-photo"
        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
      />
      <div className="candidate-name">{name}</div>

      {showVotes && (
        <div className="vote-info">
          <div className="vote-bar-wrap">
            <div className="vote-bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="vote-count">{voteCount}표 ({pct}%)</div>
        </div>
      )}

      {voteButtonState === 'active' && (
        <button className="vote-btn" onClick={() => onVote(candidate)}>
          투표하기
        </button>
      )}
      {voteButtonState === 'voted' && (
        <button className="vote-btn voted" disabled>
          ✓ 투표 완료
        </button>
      )}
      {voteButtonState === 'disabled' && (
        <button
          className="vote-btn"
          disabled
          title="투표하려면 지갑을 연결하세요"
        >
          투표하기
        </button>
      )}
    </div>
  );
}
