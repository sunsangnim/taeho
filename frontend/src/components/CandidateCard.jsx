import './CandidateCard.css';

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23e0e0e0"/><text x="50%25" y="54%25" text-anchor="middle" dominant-baseline="middle" font-size="48" fill="%23999">👤</text></svg>';

export default function CandidateCard({
  candidate,
  showVotes = false,
  totalVotes = 0,
  isWinner = false,
  onVote = null, // Phase 5에서 연결
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

      {onVote && (
        <button className="vote-btn" onClick={() => onVote(candidate)}>
          투표하기
        </button>
      )}
    </div>
  );
}
