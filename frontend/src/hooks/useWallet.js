import { useState, useEffect, useCallback } from 'react';
import { getBrowserProvider } from '../utils/providers';
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX } from '../contract';

export function useWallet() {
  const [account, setAccount] = useState(null);       // 연결된 지갑 주소
  const [chainId, setChainId] = useState(null);        // 현재 체인 ID
  const [isInstalled, setIsInstalled] = useState(true); // MetaMask 설치 여부
  const [isConnecting, setIsConnecting] = useState(false);

  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  // MetaMask 설치 여부 초기 확인 + 이미 연결된 계정 자동 감지
  useEffect(() => {
    if (!window.ethereum) {
      setIsInstalled(false);
      return;
    }

    // 이미 연결된 계정 자동 재연결 (eth_accounts는 팝업 없이 조회)
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    });

    // 현재 체인 ID 조회
    window.ethereum.request({ method: 'eth_chainId' }).then((hex) => {
      setChainId(parseInt(hex, 16));
    });

    // 계정 변경 이벤트
    const handleAccountsChanged = (accounts) => {
      setAccount(accounts.length > 0 ? accounts[0] : null);
    };

    // 네트워크 변경 이벤트
    const handleChainChanged = (hex) => {
      setChainId(parseInt(hex, 16));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // 지갑 연결
  const connect = useCallback(async () => {
    if (!window.ethereum) return;
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch {
      // 사용자 거부 등 무시
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // 지갑 연결 해제 (MetaMask는 강제 해제 API 없음 → 상태만 초기화)
  const disconnect = useCallback(() => {
    setAccount(null);
  }, []);

  // Sepolia 네트워크로 전환 요청
  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (err) {
      // 4902: 네트워크 미등록 → 추가 요청
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
      }
    }
  }, []);

  return {
    account,
    chainId,
    isInstalled,
    isConnecting,
    isSepolia,
    connect,
    disconnect,
    switchToSepolia,
  };
}
