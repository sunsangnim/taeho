/**
 * 컨트랙트 revert / MetaMask 오류를 사용자 친화적 메시지로 변환
 */
export function parseTxError(err) {
  if (!err) return '알 수 없는 오류가 발생했습니다.';

  const msg = err.message || '';
  const reason = err.reason || '';
  const combined = (msg + reason).toLowerCase();

  if (
    err.code === 'ACTION_REJECTED' ||
    err.code === 4001 ||
    combined.includes('user rejected') ||
    combined.includes('user denied')
  ) {
    return null; // 사용자가 직접 거부 → 조용히 처리
  }

  if (combined.includes('already voted')) return '이미 투표하셨습니다.';
  if (combined.includes('voting is not active')) return '현재 투표가 진행 중이 아닙니다.';
  if (combined.includes('invalid candidate')) return '유효하지 않은 후보자입니다.';
  if (
    combined.includes('insufficient funds') ||
    combined.includes('insufficient balance') ||
    combined.includes('gas')
  ) {
    return '테스트 ETH가 부족합니다. Faucet에서 충전해 주세요.';
  }

  // revert reason 파싱
  const revertMatch = msg.match(/reverted with reason string '([^']+)'/);
  if (revertMatch) return revertMatch[1];

  return '트랜잭션 처리 중 오류가 발생했습니다.';
}
