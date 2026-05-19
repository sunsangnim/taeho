# 블록체인 기반 전자투표 시스템

Ethereum Sepolia 테스트넷에 배포된 스마트 컨트랙트를 활용한 분산형 전자투표 DApp입니다.

## 주요 기능

- MetaMask 지갑 연결 및 신원 인증
- 관리자: 후보자 등록/삭제, 선거 시작/종료
- 유권자: 1인 1표 투표 (이중 투표 방지)
- 실시간 득표수 현황 (5초 폴링)
- 선거 상태별 UI (READY / ACTIVE / ENDED)
- 당선자 자동 집계 (동점 처리 포함)

## 기술 스택

| 구분 | 기술 |
|------|------|
| 스마트 컨트랙트 | Solidity ^0.8.20, Ethereum Sepolia |
| 프론트엔드 | React + Vite, ethers.js v6 |
| 백엔드 | Node.js, Express, node:sqlite (내장) |

## 사전 요구사항

- **Node.js v22.5.0 이상** — `node:sqlite` 내장 모듈 사용 (Python 빌드 불필요)
- **MetaMask** 브라우저 확장 프로그램 설치
- **Sepolia 테스트 ETH** — 트랜잭션 수수료용 소량 필요

> Sepolia 테스트 ETH는 [https://sepoliafaucet.com](https://sepoliafaucet.com) 에서 무료로 받을 수 있습니다.

## 실행 방법

### 1. 코드 받기

```bash
git clone https://github.com/sunsangnim/taeho.git
cd taeho
```

### 2. 환경변수 파일 생성

`frontend/.env` 파일을 아래 내용으로 생성합니다.

```env
VITE_CONTRACT_ADDRESS=0xa51DDAc2a92DFF5314E5aA26DaAc3362EDc1f6bE
VITE_BACKEND_URL=http://localhost:3001
```

### 3. 백엔드 실행

```bash
cd backend
npm install
node server.js
```

터미널에 `Server running on port 3001` 메시지가 나오면 정상 실행된 것입니다.

### 4. 프론트엔드 실행 (새 터미널)

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

## 사용 방법

### 유권자

1. MetaMask를 **Sepolia 네트워크**로 설정
2. 우측 상단 **지갑 연결** 버튼 클릭
3. 선거가 **진행 중(ACTIVE)** 상태일 때 후보자 카드의 **투표** 버튼 클릭
4. MetaMask 트랜잭션 서명 후 완료

### 관리자

> 관리자는 컨트랙트 배포자 지갑(`0x103b4e7a4bDeE466ABa5751db102Fd2F375178f7`)으로만 접근 가능합니다.

1. 관리자 지갑으로 연결 후 상단 **관리자** 탭 이동
2. **후보자 등록** → 이름 입력 후 등록 (선거 시작 전에만 가능)
3. **선거 시작** (후보자 2명 이상 필요)
4. 투표 완료 후 **선거 종료** → 당선자 자동 표시

## 디렉토리 구조

```
오픈소스블록체인/
├── contract/
│   ├── Voting.sol              # 스마트 컨트랙트 소스
│   └── contract-info.json      # ABI + 배포 정보
├── backend/
│   ├── server.js               # 진입점 (포트 3001)
│   └── src/
│       ├── app.js
│       ├── db.js               # node:sqlite 내장 모듈
│       └── routes/candidates.js
└── frontend/
    ├── .env                    # 환경변수 (직접 생성 필요)
    └── src/
        ├── contract/index.js   # ABI + 컨트랙트 주소
        ├── hooks/              # useWallet, useElectionStatus 등
        ├── utils/              # providers, txError
        ├── components/         # Header, CandidateCard, VoteModal 등
        └── pages/              # Home, Admin
```

## 스마트 컨트랙트 정보

| 항목 | 값 |
|------|----|
| 네트워크 | Ethereum Sepolia Testnet |
| Chain ID | 11155111 |
| 컨트랙트 주소 | `0xa51DDAc2a92DFF5314E5aA26DaAc3362EDc1f6bE` |
| 배포자(관리자) | `0x103b4e7a4bDeE466ABa5751db102Fd2F375178f7` |
| 배포일 | 2026-05-12 |

## 백엔드 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/candidates` | 후보자 목록 조회 |
| POST | `/api/candidates` | 후보자 등록 |
| DELETE | `/api/candidates/:id` | 후보자 삭제 |

## 트러블슈팅

**백엔드 실행 시 `node:sqlite` 오류가 발생하는 경우**
→ Node.js 버전을 v22.5.0 이상으로 업그레이드하세요.
```bash
node --version  # v22.5.0 이상인지 확인
```

**MetaMask 연결이 안 되는 경우**
→ 네트워크를 Sepolia Testnet으로 변경했는지 확인하세요.

**트랜잭션이 실패하는 경우**
→ Sepolia 테스트 ETH 잔액을 확인하세요.
