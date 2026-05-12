// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting
 * @notice Ethereum Sepolia 기반 블록체인 투표 시스템 스마트 컨트랙트
 * @dev 수업 실습용 — 동접 최대 5명, 투표 수 30개 미만 환경 가정
 */
contract Voting {
    // ───────────────────────────────────────────────
    //  상태 변수
    // ───────────────────────────────────────────────

    address public owner;

    enum ElectionStatus { READY, ACTIVE, ENDED }
    ElectionStatus public electionStatus;

    struct Candidate {
        uint id;        // candidateCounter 기반 auto-increment (배열 인덱스와 분리)
        string name;
        uint voteCount;
    }

    Candidate[] private candidates;
    uint public candidateCounter;

    mapping(address => bool) public hasVoted;
    uint public totalVotes;

    // ───────────────────────────────────────────────
    //  이벤트
    // ───────────────────────────────────────────────

    event CandidateAdded(uint id, string name);
    event CandidateRemoved(uint id);
    event VotingStarted();
    event VotingEnded();
    event VoteCast(address indexed voter, uint candidateId);

    // ───────────────────────────────────────────────
    //  Modifier
    // ───────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ───────────────────────────────────────────────
    //  생성자
    // ───────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        electionStatus = ElectionStatus.READY;
    }

    // ───────────────────────────────────────────────
    //  관리자 전용 함수
    // ───────────────────────────────────────────────

    /**
     * @notice 후보자 등록 (선거 시작 전에만 가능)
     * @param name 후보자 이름
     */
    function addCandidate(string calldata name) external onlyOwner {
        require(electionStatus == ElectionStatus.READY, "Voting already started");
        candidateCounter++;
        candidates.push(Candidate({
            id: candidateCounter,
            name: name,
            voteCount: 0
        }));
        emit CandidateAdded(candidateCounter, name);
    }

    /**
     * @notice 후보자 삭제 — swap-and-pop 패턴으로 gap 없이 제거 (선거 시작 전에만 가능)
     * @param id 삭제할 후보자의 컨트랙트 ID
     */
    function removeCandidate(uint id) external onlyOwner {
        require(electionStatus == ElectionStatus.READY, "Voting already started");

        uint indexToRemove = type(uint).max;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].id == id) {
                indexToRemove = i;
                break;
            }
        }
        require(indexToRemove != type(uint).max, "Invalid candidate");

        // swap-and-pop: 삭제 대상을 마지막 원소로 덮어쓴 뒤 pop()
        candidates[indexToRemove] = candidates[candidates.length - 1];
        candidates.pop();

        emit CandidateRemoved(id);
    }

    /**
     * @notice 선거 시작 (후보자 2명 이상 필요)
     */
    function startVoting() external onlyOwner {
        require(electionStatus == ElectionStatus.READY, "Voting already started");
        require(candidates.length >= 2, "Need at least 2 candidates");
        electionStatus = ElectionStatus.ACTIVE;
        emit VotingStarted();
    }

    /**
     * @notice 선거 종료
     */
    function endVoting() external onlyOwner {
        require(electionStatus == ElectionStatus.ACTIVE, "Voting is not active");
        electionStatus = ElectionStatus.ENDED;
        emit VotingEnded();
    }

    // ───────────────────────────────────────────────
    //  일반 사용자 함수
    // ───────────────────────────────────────────────

    /**
     * @notice 투표 — 1인 1표, 진행 중인 선거에서만 가능
     * @param candidateId 투표할 후보자의 컨트랙트 ID (배열 인덱스 아님)
     */
    function vote(uint candidateId) external {
        require(electionStatus == ElectionStatus.ACTIVE, "Voting is not active");
        require(!hasVoted[msg.sender], "Already voted");

        bool found = false;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].id == candidateId) {
                candidates[i].voteCount++;
                found = true;
                break;
            }
        }
        require(found, "Invalid candidate");

        hasVoted[msg.sender] = true;
        totalVotes++;
        emit VoteCast(msg.sender, candidateId);
    }

    // ───────────────────────────────────────────────
    //  View 함수 (가스비 없음)
    // ───────────────────────────────────────────────

    /**
     * @notice 후보자 전체 목록 반환
     */
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @notice 현재 선거 상태 반환 (0=READY, 1=ACTIVE, 2=ENDED)
     */
    function getElectionStatus() external view returns (ElectionStatus) {
        return electionStatus;
    }

    /**
     * @notice 특정 주소의 투표 여부 확인
     * @param voter 확인할 지갑 주소
     */
    function checkHasVoted(address voter) external view returns (bool) {
        return hasVoted[voter];
    }

    /**
     * @notice 당선자 ID 배열 반환 — 동점 시 해당 ID 전체를 배열로 반환
     * @dev 선거 종료(ENDED) 상태에서만 호출 가능
     */
    function getWinner() external view returns (uint[] memory) {
        require(electionStatus == ElectionStatus.ENDED, "Voting not ended");

        // 1단계: 최다 득표 수 탐색
        uint maxVotes = 0;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
            }
        }

        // 2단계: 당선자 수 카운트 (동점 처리)
        uint winnerCount = 0;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount == maxVotes) {
                winnerCount++;
            }
        }

        // 3단계: 당선자 ID 배열 구성
        uint[] memory winnerIds = new uint[](winnerCount);
        uint idx = 0;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount == maxVotes) {
                winnerIds[idx] = candidates[i].id;
                idx++;
            }
        }

        return winnerIds;
    }
}
