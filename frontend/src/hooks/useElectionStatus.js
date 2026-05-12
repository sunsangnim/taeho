import { useState, useEffect } from 'react';
import { getReadContract } from '../utils/providers';

export const STATUS = { READY: 0, ACTIVE: 1, ENDED: 2 };

const POLL_INTERVAL = 5000;

export function useElectionStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const contract = await getReadContract();
        if (!contract || cancelled) return;
        const s = await contract.getElectionStatus();
        if (!cancelled) setStatus(Number(s));
      } catch {
        // 네트워크 오류 등 무시
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { status, loading };
}
