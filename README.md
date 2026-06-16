# 블록체인 기반 전자투표 시스템

Ethereum Sepolia 테스트넷에 배포된 스마트 컨트랙트를 활용한 분산형 전자투표 DApp입니다.  
MetaMask 지갑으로 신원을 인증하고, 블록체인에 투표 결과를 기록합니다.

## 동작 흐름

```
관리자: 후보자 등록 → 선거 시작
유권자: MetaMask 연결 → 투표
관리자: 선거 종료 → 당선자 자동 집계
```

## 주요 기능

- **MetaMask 지갑 연결** — 지갑 주소로 신원 인증
- **관리자 기능** — 후보자 등록/삭제, 선거 시작/종료
- **1인 1표 보장** — 스마트 컨트랙트 레벨에서 이중 투표 방지
- **실시간 득표 현황** — 5초 폴링으로 자동 갱신
- **선거 상태 관리** — READY / ACTIVE / ENDED 단계별 UI
- **당선자 자동 집계** — 동점 처리 포함

## 기술 스택

| 구분 | 기술 |
|------|------|
| 스마트 컨트랙트 | Solidity ^0.8.20, Ethereum Sepolia |
| 프론트엔드 | React + Vite, ethers.js v6 |
| 백엔드 | Node.js, Express, node:sqlite (내장) |

## 스마트 컨트랙트 정보

| 항목 | 값 |
|------|----|
| 네트워크 | Ethereum Sepolia Testnet |
| Chain ID | 11155111 |
| 컨트랙트 주소 | `0xa51DDAc2a92DFF5314E5aA26DaAc3362EDc1f6bE` |
| 관리자 지갑 | `0x103b4e7a4bDeE466ABa5751db102Fd2F375178f7` |
| 배포일 | 2026-05-12 |

## 사전 요구사항

- **Node.js v22.5.0 이상** — `node:sqlite` 내장 모듈 사용
- **MetaMask** 브라우저 확장 프로그램
- **Sepolia 테스트 ETH** — [sepoliafaucet.com](https://sepoliafaucet.com) 에서 무료 수령

## 실행 방법

### 1. 코드 받기

```bash
git clone https://github.com/sunsangnim/blockchain-vote-system.git
cd blockchain-vote-system/투표시스템
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
# → Server running on port 3001
```

### 4. 프론트엔드 실행 (새 터미널)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## 사용 방법

### 유권자

1. MetaMask를 **Sepolia 네트워크**로 설정
2. 우측 상단 **지갑 연결** 클릭
3. 선거가 **ACTIVE** 상태일 때 후보자 카드의 **투표** 버튼 클릭
4. MetaMask 트랜잭션 서명 후 완료

### 관리자

> 컨트랙트 배포자 지갑(`0x103b4e7a4bDeE466ABa5751db102Fd2F375178f7`)으로만 접근 가능합니다.

1. 관리자 지갑 연결 후 상단 **관리자** 탭 이동
2. **후보자 등록** (선거 시작 전에만 가능)
3. **선거 시작** (후보자 2명 이상 필요)
4. **선거 종료** → 당선자 자동 표시

## 디렉토리 구조

```
투표시스템/
├── contract/
│   ├── Voting.sol              # 스마트 컨트랙트 소스
│   └── contract-info.json      # ABI + 배포 정보
├── backend/
│   ├── server.js               # 진입점 (포트 3001)
│   └── src/
│       ├── app.js
│       ├── db.js               # SQLite (node:sqlite 내장)
│       └── routes/candidates.js
└── frontend/
    ├── .env                    # 환경변수 (직접 생성 필요)
    └── src/
        ├── contract/index.js   # ABI + 컨트랙트 주소
        ├── hooks/              # useWallet, useElectionStatus 등
        ├── components/         # Header, CandidateCard, VoteModal 등
        └── pages/              # Home, Admin
```

## 백엔드 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/candidates` | 후보자 목록 조회 |
| POST | `/api/candidates` | 후보자 등록 |
| DELETE | `/api/candidates/:id` | 후보자 삭제 |

## 트러블슈팅

**`node:sqlite` 오류**  
→ Node.js를 v22.5.0 이상으로 업그레이드하세요.

**MetaMask 연결 안 됨**  
→ 네트워크를 Sepolia Testnet으로 변경했는지 확인하세요.

**트랜잭션 실패**  
→ Sepolia 테스트 ETH 잔액을 확인하세요.
