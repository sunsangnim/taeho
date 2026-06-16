import { useState, useEffect } from 'react';
import { getReadContract } from '../utils/providers';

/**
 * 연결된 지갑 주소가 이미 투표했는지 확인
 * account 변경 또는 refresh() 호출 시 재조회
 */
export function useHasVoted(account) {
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function check() {
    if (!account) { setHasVoted(false); return; }
    setLoading(true);
    try {
      const contract = await getReadContract();
      if (!contract) return;
      const result = await contract.checkHasVoted(account);
      setHasVoted(result);
    } catch {
      setHasVoted(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  return { hasVoted, loading, refresh: check };
}
