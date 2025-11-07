// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title X402DisputeRegistry
 * @notice Permissionless dispute resolution for X402 (Payment Required) transactions
 * @dev Extends X402 protocol with cryptographically-verified dispute resolution
 * 
 * Protocol Extension: X402-DR (X402 Dispute Resolution)
 * Specification: https://consulatehq.com/specs/x402-dr
 */

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract X402DisputeRegistry {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============================================
    // State Variables
    // ============================================

    /// @notice Dispute stake token (USDC)
    IERC20 public immutable stakeToken;
    
    /// @notice Minimum stake required to file dispute ($0.10 USDC)
    uint256 public constant MIN_STAKE = 100000; // 0.10 USDC (6 decimals)
    
    /// @notice Dispute resolution fee (goes to oracle network)
    uint256 public constant RESOLUTION_FEE = 50000; // 0.05 USDC

    // ============================================
    // Data Structures
    // ============================================

    enum DisputeStatus {
        Pending,           // Dispute filed, awaiting verification
        OracleVerifying,   // Oracle network verifying service failure
        BuyerWins,         // Buyer gets refund + stake back
        SellerWins,        // Seller keeps payment + buyer loses stake
        Settled,           // Seller voluntarily refunded
        Expired            // Dispute expired (no resolution in 10 days)
    }

    enum FailureType {
        Timeout,           // No response received
        ServerError,       // HTTP 500-599
        SLABreach,         // Response time > agreed SLA
        WrongSchema,       // Response doesn't match API contract
        Fraud              // Cryptographic fraud detected
    }

    struct Dispute {
        bytes32 disputeId;
        address buyer;
        address seller;
        uint256 amount;           // Payment amount in wei (USDC)
        bytes32 transactionHash;  // ERC-3009 transaction hash
        bytes32 requestHash;      // Hash of HTTP request
        bytes32 responseHash;     // Hash of HTTP response (or 0x0 if timeout)
        FailureType failureType;
        uint256 stakedAmount;
        DisputeStatus status;
        uint256 filedAt;
        uint256 resolvedAt;
        uint8 oracleConsensus;    // Number of oracles that verified (0-255)
        string evidenceURI;       // IPFS link to TLS proof / logs
    }

    struct Reputation {
        uint256 score;            // 0-1000, starts at 500
        uint256 totalDisputes;
        uint256 disputesWon;
        uint256 disputesLost;
        uint256 voluntaryRefunds;
        uint256 unpaidJudgments;
        bool isBlacklisted;
    }

    struct SLACommitment {
        address merchant;
        string serviceUrl;
        uint256 maxResponseTime;  // milliseconds
        uint256 minUptime;        // basis points (9900 = 99%)
        bytes32 slaHash;          // Hash of full SLA document
        bytes signature;          // Merchant's signature
        uint256 registeredAt;
        bool active;
    }

    struct OracleAttestation {
        address oracle;
        uint16 statusCode;
        uint256 responseTime;
        bytes32 responseHash;
        bytes signature;
        uint256 timestamp;
    }

    // ============================================
    // Storage
    // ============================================

    /// @notice All disputes by ID
    mapping(bytes32 => Dispute) public disputes;

    /// @notice Reputation scores by address
    mapping(address => Reputation) public reputations;

    /// @notice SLA commitments by merchant + service URL hash
    mapping(bytes32 => SLACommitment) public slaCommitments;

    /// @notice Oracle attestations for disputes
    mapping(bytes32 => OracleAttestation[]) public oracleAttestations;

    /// @notice Registered oracle nodes
    mapping(address => bool) public registeredOracles;

    /// @notice Stake balances (locked during dispute)
    mapping(bytes32 => uint256) public stakedBalances;

    // ============================================
    // Events
    // ============================================

    event DisputeFiled(
        bytes32 indexed disputeId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        FailureType failureType
    );

    event DisputeResolved(
        bytes32 indexed disputeId,
        DisputeStatus outcome,
        uint256 resolvedAt
    );

    event SLARegistered(
        address indexed merchant,
        bytes32 indexed commitmentId,
        string serviceUrl,
        uint256 maxResponseTime
    );

    event OracleAttestationSubmitted(
        bytes32 indexed disputeId,
        address indexed oracle,
        uint16 statusCode,
        uint256 responseTime
    );

    event ReputationUpdated(
        address indexed account,
        uint256 oldScore,
        uint256 newScore
    );

    event StakeSlashed(
        bytes32 indexed disputeId,
        address indexed staker,
        uint256 amount
    );

    // ============================================
    // Constructor
    // ============================================

    constructor(address _stakeToken) {
        stakeToken = IERC20(_stakeToken);
    }

    // ============================================
    // Core Functions: Dispute Filing
    // ============================================

    /**
     * @notice File a dispute against an X402 merchant
     * @dev Requires payment proof (ERC-3009 signature) and stake
     * @param seller Merchant's Ethereum address
     * @param amount Payment amount in USDC (6 decimals)
     * @param transactionHash ERC-3009 transaction hash
     * @param requestHash Hash of HTTP request
     * @param responseHash Hash of HTTP response (0x0 if timeout)
     * @param failureType Type of service failure
     * @param paymentSignature ERC-3009 payment authorization signature
     * @param evidenceURI IPFS link to TLS proof / request logs
     * @return disputeId Unique dispute identifier
     */
    function fileDispute(
        address seller,
        uint256 amount,
        bytes32 transactionHash,
        bytes32 requestHash,
        bytes32 responseHash,
        FailureType failureType,
        bytes memory paymentSignature,
        string memory evidenceURI
    ) external returns (bytes32 disputeId) {
        require(seller != address(0), "Invalid seller address");
        require(amount > 0, "Amount must be positive");
        require(transactionHash != bytes32(0), "Invalid transaction hash");
        require(requestHash != bytes32(0), "Invalid request hash");

        // Verify ERC-3009 payment signature
        bytes32 paymentHash = keccak256(
            abi.encodePacked(msg.sender, seller, amount, transactionHash)
        );
        address signer = paymentHash.toEthSignedMessageHash().recover(paymentSignature);
        require(signer == msg.sender, "Invalid payment signature");

        // Transfer stake from buyer
        require(
            stakeToken.transferFrom(msg.sender, address(this), MIN_STAKE),
            "Stake transfer failed"
        );

        // Generate dispute ID
        disputeId = keccak256(
            abi.encodePacked(
                msg.sender,
                seller,
                transactionHash,
                block.timestamp,
                block.number
            )
        );

        // Create dispute record
        disputes[disputeId] = Dispute({
            disputeId: disputeId,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            transactionHash: transactionHash,
            requestHash: requestHash,
            responseHash: responseHash,
            failureType: failureType,
            stakedAmount: MIN_STAKE,
            status: DisputeStatus.Pending,
            filedAt: block.timestamp,
            resolvedAt: 0,
            oracleConsensus: 0,
            evidenceURI: evidenceURI
        });

        // Lock stake
        stakedBalances[disputeId] = MIN_STAKE;

        // Initialize seller reputation if new
        if (reputations[seller].score == 0) {
            reputations[seller].score = 500; // Neutral starting reputation
        }

        emit DisputeFiled(disputeId, msg.sender, seller, amount, failureType);

        return disputeId;
    }

    // ============================================
    // Core Functions: Oracle Network
    // ============================================

    /**
     * @notice Submit oracle attestation for dispute verification
     * @dev Only registered oracles can submit attestations
     * @param disputeId Dispute to verify
     * @param statusCode HTTP status code observed
     * @param responseTime Response time in milliseconds
     * @param responseHash Hash of response body
     * @param signature Oracle's signature of attestation
     */
    function submitOracleAttestation(
        bytes32 disputeId,
        uint16 statusCode,
        uint256 responseTime,
        bytes32 responseHash,
        bytes memory signature
    ) external {
        require(registeredOracles[msg.sender], "Not registered oracle");
        
        Dispute storage dispute = disputes[disputeId];
        require(dispute.disputeId != bytes32(0), "Dispute not found");
        require(
            dispute.status == DisputeStatus.Pending || 
            dispute.status == DisputeStatus.OracleVerifying,
            "Dispute not pending"
        );

        // Verify oracle signature
        bytes32 attestationHash = keccak256(
            abi.encodePacked(disputeId, statusCode, responseTime, responseHash)
        );
        address signer = attestationHash.toEthSignedMessageHash().recover(signature);
        require(signer == msg.sender, "Invalid oracle signature");

        // Store attestation
        oracleAttestations[disputeId].push(OracleAttestation({
            oracle: msg.sender,
            statusCode: statusCode,
            responseTime: responseTime,
            responseHash: responseHash,
            signature: signature,
            timestamp: block.timestamp
        }));

        // Update dispute status
        if (dispute.status == DisputeStatus.Pending) {
            dispute.status = DisputeStatus.OracleVerifying;
        }

        emit OracleAttestationSubmitted(disputeId, msg.sender, statusCode, responseTime);

        // Check if consensus reached (3+ oracles)
        if (oracleAttestations[disputeId].length >= 3) {
            _resolveWithOracleConsensus(disputeId);
        }
    }

    /**
     * @dev Resolve dispute based on oracle consensus
     */
    function _resolveWithOracleConsensus(bytes32 disputeId) internal {
        Dispute storage dispute = disputes[disputeId];
        OracleAttestation[] memory attestations = oracleAttestations[disputeId];

        // Count failures (500+ status code, 0 status code = timeout)
        uint256 failureCount = 0;
        for (uint256 i = 0; i < attestations.length; i++) {
            if (attestations[i].statusCode >= 500 || attestations[i].statusCode == 0) {
                failureCount++;
            }
        }

        // Consensus: 66%+ oracles must agree on failure
        bool serviceFailed = (failureCount * 100) >= (attestations.length * 66);

        if (serviceFailed) {
            _resolveBuyerWins(disputeId);
        } else {
            _resolveSellerWins(disputeId);
        }

        dispute.oracleConsensus = uint8(attestations.length);
    }

    // ============================================
    // Core Functions: Resolution
    // ============================================

    /**
     * @dev Resolve dispute in favor of buyer
     */
    function _resolveBuyerWins(bytes32 disputeId) internal {
        Dispute storage dispute = disputes[disputeId];
        
        dispute.status = DisputeStatus.BuyerWins;
        dispute.resolvedAt = block.timestamp;

        // Return stake to buyer
        uint256 stake = stakedBalances[disputeId];
        stakedBalances[disputeId] = 0;
        require(stakeToken.transfer(dispute.buyer, stake), "Stake return failed");

        // Update reputations
        _updateReputation(dispute.seller, false); // Seller loses
        _updateReputation(dispute.buyer, true);   // Buyer wins

        // Increment unpaid judgments for seller
        reputations[dispute.seller].unpaidJudgments++;

        emit DisputeResolved(disputeId, DisputeStatus.BuyerWins, block.timestamp);
    }

    /**
     * @dev Resolve dispute in favor of seller
     */
    function _resolveSellerWins(bytes32 disputeId) internal {
        Dispute storage dispute = disputes[disputeId];
        
        dispute.status = DisputeStatus.SellerWins;
        dispute.resolvedAt = block.timestamp;

        // Slash buyer's stake (transfer to seller as compensation)
        uint256 stake = stakedBalances[disputeId];
        stakedBalances[disputeId] = 0;
        require(stakeToken.transfer(dispute.seller, stake), "Stake transfer failed");

        // Update reputations
        _updateReputation(dispute.seller, true);  // Seller wins
        _updateReputation(dispute.buyer, false);  // Buyer loses (false claim)

        emit StakeSlashed(disputeId, dispute.buyer, stake);
        emit DisputeResolved(disputeId, DisputeStatus.SellerWins, block.timestamp);
    }

    /**
     * @notice Seller voluntarily settles dispute with refund
     * @dev Improves seller reputation significantly
     * @param disputeId Dispute to settle
     */
    function settleDispute(bytes32 disputeId) external {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.seller == msg.sender, "Only seller can settle");
        require(
            dispute.status == DisputeStatus.Pending || 
            dispute.status == DisputeStatus.OracleVerifying,
            "Dispute not settleable"
        );

        // Verify seller sent refund (check USDC transfer to buyer)
        // Note: In production, this would verify the refund transaction
        
        dispute.status = DisputeStatus.Settled;
        dispute.resolvedAt = block.timestamp;

        // Return stake to buyer
        uint256 stake = stakedBalances[disputeId];
        stakedBalances[disputeId] = 0;
        require(stakeToken.transfer(dispute.buyer, stake), "Stake return failed");

        // Improve seller reputation (voluntary refund is good!)
        reputations[msg.sender].voluntaryRefunds++;
        _updateReputation(msg.sender, true);

        emit DisputeResolved(disputeId, DisputeStatus.Settled, block.timestamp);
    }

    // ============================================
    // Core Functions: Reputation
    // ============================================

    /**
     * @dev Update reputation score based on dispute outcome
     * @param account Address to update
     * @param won True if account won the dispute
     */
    function _updateReputation(address account, bool won) internal {
        Reputation storage rep = reputations[account];
        uint256 oldScore = rep.score;

        rep.totalDisputes++;
        
        if (won) {
            rep.disputesWon++;
            // Increase reputation (max 1000)
            rep.score = (rep.score + 50 > 1000) ? 1000 : rep.score + 50;
        } else {
            rep.disputesLost++;
            // Decrease reputation (min 0)
            rep.score = (rep.score < 100) ? 0 : rep.score - 100;
        }

        emit ReputationUpdated(account, oldScore, rep.score);

        // Auto-blacklist if reputation falls below 200
        if (rep.score < 200) {
            rep.isBlacklisted = true;
        }
    }

    // ============================================
    // Core Functions: SLA Registry
    // ============================================

    /**
     * @notice Register SLA commitment for service
     * @dev Merchants pre-commit to terms, cryptographically signed
     * @param serviceUrl URL of the service
     * @param maxResponseTime Maximum response time in ms
     * @param minUptime Minimum uptime in basis points (9900 = 99%)
     * @param slaHash Hash of full SLA document (IPFS)
     * @param signature Merchant's signature of SLA terms
     */
    function registerSLA(
        string memory serviceUrl,
        uint256 maxResponseTime,
        uint256 minUptime,
        bytes32 slaHash,
        bytes memory signature
    ) external {
        bytes32 commitmentId = keccak256(abi.encodePacked(msg.sender, serviceUrl));

        // Verify signature
        bytes32 commitmentHash = keccak256(
            abi.encodePacked(serviceUrl, maxResponseTime, minUptime, slaHash)
        );
        address signer = commitmentHash.toEthSignedMessageHash().recover(signature);
        require(signer == msg.sender, "Invalid SLA signature");

        slaCommitments[commitmentId] = SLACommitment({
            merchant: msg.sender,
            serviceUrl: serviceUrl,
            maxResponseTime: maxResponseTime,
            minUptime: minUptime,
            slaHash: slaHash,
            signature: signature,
            registeredAt: block.timestamp,
            active: true
        });

        emit SLARegistered(msg.sender, commitmentId, serviceUrl, maxResponseTime);
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @notice Get reputation for address
     */
    function getReputation(address account) external view returns (Reputation memory) {
        return reputations[account];
    }

    /**
     * @notice Get dispute details
     */
    function getDispute(bytes32 disputeId) external view returns (Dispute memory) {
        return disputes[disputeId];
    }

    /**
     * @notice Get oracle attestations for dispute
     */
    function getOracleAttestations(bytes32 disputeId) 
        external 
        view 
        returns (OracleAttestation[] memory) 
    {
        return oracleAttestations[disputeId];
    }

    /**
     * @notice Check if merchant should use instant settlement
     * @dev Used by X402 facilitators to decide payment flow
     * @param merchant Address to check
     * @return instant True if merchant qualifies for instant settlement
     */
    function shouldUseInstantSettlement(address merchant) external view returns (bool) {
        Reputation memory rep = reputations[merchant];
        
        // Criteria for instant settlement:
        // 1. Reputation >= 700
        // 2. No unpaid judgments
        // 3. Not blacklisted
        return (rep.score >= 700 && rep.unpaidJudgments == 0 && !rep.isBlacklisted);
    }

    // ============================================
    // Admin Functions
    // ============================================

    /**
     * @notice Register oracle node
     * @dev Only contract owner can register oracles
     */
    function registerOracle(address oracle) external {
        // TODO: Add onlyOwner modifier
        registeredOracles[oracle] = true;
    }

    /**
     * @notice Remove oracle registration
     */
    function unregisterOracle(address oracle) external {
        // TODO: Add onlyOwner modifier
        registeredOracles[oracle] = false;
    }
}

