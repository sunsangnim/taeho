import { useState, useEffect } from 'react';
import { useElectionStatus, STATUS } from '../hooks/useElectionStatus';
import { useCandidates } from '../hooks/useCandidates';
import { useHasVoted } from '../hooks/useHasVoted';
import { useWallet } from '../hooks/useWallet';
import { getReadContract } from '../utils/providers';
import { CONTRACT_ADDRESS } from '../contract';
import CandidateCard from '../components/CandidateCard';
import VoteModal from '../components/VoteModal';
import './Home.css';

const ETHERSCAN_URL = `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`;

export default function Home() {
  const { account } = useWallet();
  const { status, loading: statusLoading } = useElectionStatus();
  const { candidates, loading: candidatesLoading, refresh: refreshCandidates } = useCandidates();
  const { hasVoted, refresh: refreshHasVoted } = useHasVoted(account);
  const [winnerIds, setWinnerIds] = useState([]);
  const [voteTarget, setVoteTarget] = useState(null); // 투표 모달 대상 후보자

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  // ENDED 상태일 때 당선자 조회
  useEffect(() => {
    if (status !== STATUS.ENDED) { setWinnerIds([]); return; }
    getReadContract().then((contract) => {
      if (!contract) return;
      contract.getWinner()
        .then((ids) => setWinnerIds(ids.map(Number)))
        .catch(() => setWinnerIds([]));
    });
  }, [status]);

  // ACTIVE 상태에서 투표 버튼 상태 결정
  function getVoteButtonState() {
    if (!account) return 'disabled';
    if (hasVoted) return 'voted';
    return 'active';
  }

  // 투표 완료 후 데이터 갱신
  function handleVoteSuccess() {
    refreshCandidates();
    refreshHasVoted();
  }

  if (statusLoading || candidatesLoading) {
    return <div className="home-loading">불러오는 중...</div>;
  }

  // ── READY ─────────────────────────────────────
  if (status === STATUS.READY) {
    return (
      <div className="home">
        <div className="election-banner banner-ready">
          ⏳ 선거 준비 중 — 아직 투표가 시작되지 않았습니다.
        </div>
        {candidates.length === 0 ? (
          <p className="empty-msg">등록된 후보자가 없습니다.</p>
        ) : (
          <>
            <p className="candidate-count">등록된 후보자 {candidates.length}명 | 투표 시작 대기 중</p>
            <div className="card-grid">
              {candidates.map((c) => (
                <CandidateCard key={c.id} candidate={c} showVotes={false} voteButtonState="hidden" />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── ACTIVE ────────────────────────────────────
  if (status === STATUS.ACTIVE) {
    const btnState = getVoteButtonState();
    return (
      <div className="home">
        <div className="election-banner banner-active">
          🟢 투표 진행 중 &nbsp;|&nbsp; 총 투표 수: {totalVotes}표
        </div>
        <div className="card-grid">
          {candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              showVotes={true}
              totalVotes={totalVotes}
              voteButtonState={btnState}
              onVote={btnState === 'active' ? setVoteTarget : null}
            />
          ))}
        </div>

        {/* 투표 확인 모달 */}
        {voteTarget && (
          <VoteModal
            candidate={voteTarget}
            account={account}
            onClose={() => setVoteTarget(null)}
            onSuccess={handleVoteSuccess}
          />
        )}
      </div>
    );
  }

  // ── ENDED ─────────────────────────────────────
  if (status === STATUS.ENDED) {
    const isWinner = (id) => winnerIds.includes(id);
    const winners = candidates.filter((c) => isWinner(c.id));
    const others = candidates.filter((c) => !isWinner(c.id));
    const isJoint = winners.length > 1;

    return (
      <div className="home">
        <div className="election-banner banner-ended">
          🏁 투표 종료 &nbsp;|&nbsp; 최종 투표 수: {totalVotes}표
        </div>

        {winnerIds.length > 0 && (
          <div className="winner-section">
            <h2 className="winner-title">{isJoint ? '🏆 공동 당선자' : '🏆 당선자'}</h2>
            <div className="card-grid card-grid-winner">
              {winners.map((c) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  showVotes={true}
                  totalVotes={totalVotes}
                  isWinner={true}
                  voteButtonState="hidden"
                />
              ))}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="card-grid" style={{ marginTop: '24px' }}>
            {others.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                showVotes={true}
                totalVotes={totalVotes}
                voteButtonState="hidden"
              />
            ))}
          </div>
        )}

        <div className="etherscan-link-wrap">
          <a href={ETHERSCAN_URL} target="_blank" rel="noreferrer" className="etherscan-link">
            Sepolia Etherscan에서 결과 확인 ↗
          </a>
        </div>
      </div>
    );
  }

  return null;
}
