import { useState, useEffect, useCallback } from 'react';
import { getReadContract } from '../utils/providers';
import { BACKEND_URL } from '../contract';

const POLL_INTERVAL = 5000;

/**
 * 컨트랙트 getCandidates() + 백엔드 GET /api/candidates 를 contractId로 병합
 * 반환: [{ id, name, voteCount, photoUrl }]
 */
export function useCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    try {
      const contract = await getReadContract();
      if (!contract) return;

      // 컨트랙트 데이터 (id, name, voteCount)
      const contractData = await contract.getCandidates();

      // 백엔드 데이터 (photoUrl) — 실패해도 계속 진행
      let backendMap = {};
      try {
        const res = await fetch(`${BACKEND_URL}/api/candidates`);
        if (res.ok) {
          const list = await res.json();
          list.forEach((c) => {
            backendMap[c.contractId] = c.photoUrl;
          });
        }
      } catch {
        // 백엔드 오류 시 사진 없이 표시
      }

      // contractId로 병합
      const merged = contractData.map((c) => ({
        id: Number(c.id),
        name: c.name,
        voteCount: Number(c.voteCount),
        photoUrl: backendMap[Number(c.id)] || null,
      }));

      setCandidates(merged);
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (!cancelled) await fetchCandidates();
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchCandidates]);

  return { candidates, loading, refresh: fetchCandidates };
}
