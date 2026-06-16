import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';

/**
 * BrowserProvider — MetaMask 기반, 트랜잭션 서명 전용
 * WSS URL 없이 폴링(5초 간격)으로 이벤트 감지
 */
export function getBrowserProvider() {
  if (!window.ethereum) return null;
  return new BrowserProvider(window.ethereum);
}

/**
 * 읽기 전용 컨트랙트 인스턴스 (서명 불필요)
 */
export async function getReadContract() {
  const provider = getBrowserProvider();
  if (!provider) return null;
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * 쓰기용 컨트랙트 인스턴스 (MetaMask 서명 포함)
 */
export async function getWriteContract() {
  const provider = getBrowserProvider();
  if (!provider) return null;
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}
