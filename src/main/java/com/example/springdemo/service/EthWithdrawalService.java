package com.example.springdemo.service;

import com.example.springdemo.biz.EthWithdrawalBiz;
import com.example.springdemo.domain.EthWallet;
import com.example.springdemo.domain.EthWithdrawal;
import com.example.springdemo.repository.EthWalletRepository;
import com.example.springdemo.repository.EthWithdrawalRepository;
import com.example.springdemo.service.eth.EthereumChainService;
import com.example.springdemo.service.exception.EthWithdrawalException;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.crypto.WalletUtils;
import org.web3j.utils.Convert;
import org.web3j.utils.Numeric;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.List;

@Service
public class EthWithdrawalService implements EthWithdrawalBiz {
    private static final int MAX_ERROR_MESSAGE_LENGTH = 1000;
    private static final String STATUS_BUILT = "BUILT";
    private static final String STATUS_SIGNED = "SIGNED";
    private static final String STATUS_SUBMITTED = "SUBMITTED";
    private static final String STATUS_FAILED = "FAILED";

    private final EthWalletRepository ethWalletRepository;
    private final EthWithdrawalRepository ethWithdrawalRepository;
    private final EthereumChainService ethereumChainService;

    public EthWithdrawalService(EthWalletRepository ethWalletRepository,
                                EthWithdrawalRepository ethWithdrawalRepository,
                                EthereumChainService ethereumChainService) {
        this.ethWalletRepository = ethWalletRepository;
        this.ethWithdrawalRepository = ethWithdrawalRepository;
        this.ethereumChainService = ethereumChainService;
    }

    @Override
    public EthWithdrawal withdraw(Long uid, Long fromWalletId, String toAddress, BigDecimal amountEth) {
        EthWithdrawal withdrawal = build(uid, fromWalletId, toAddress, amountEth);
        withdrawal = sign(uid, withdrawal.getId());
        return broadcast(uid, withdrawal.getId());
    }

    @Override
    public EthWithdrawal build(Long uid, Long fromWalletId, String toAddress, BigDecimal amountEth) {
        EthWithdrawal withdrawal = null;
        try {
            BuildStageResult buildStageResult = buildStage(uid, fromWalletId, toAddress, amountEth);
            return buildStageResult.withdrawal();
        } catch (EthWithdrawalException e) {
            markFailed(withdrawal, e.getMessage());
            throw e;
        } catch (Exception e) {
            markFailed(withdrawal, e.getMessage());
            throw new EthWithdrawalException("Failed to build transaction", e);
        }
    }

    @Override
    public EthWithdrawal sign(Long uid, Long withdrawalId) {
        EthWithdrawal withdrawal = findWithdrawal(uid, withdrawalId);
        if (!STATUS_BUILT.equals(withdrawal.getStatus())) {
            throw new EthWithdrawalException("Only BUILT withdrawal can be signed");
        }

        EthWallet fromWallet = ethWalletRepository.findByIdAndUid(withdrawal.getFromWalletId(), uid)
            .orElseThrow(() -> new EthWithdrawalException("From wallet not found"));
        if (fromWallet.getPrivateKey() == null || fromWallet.getPrivateKey().isBlank()) {
            throw new EthWithdrawalException("From wallet private key is missing");
        }

        try {
            RawTransaction rawTransaction = buildRawTransactionFromWithdrawal(withdrawal);
            SignStageResult signStageResult = signStage(withdrawal, rawTransaction, fromWallet.getPrivateKey());
            withdrawal.setSignedRawTx(signStageResult.signedRawTxHex());
            withdrawal.setErrorMessage(null);
            return ethWithdrawalRepository.save(withdrawal);
        } catch (EthWithdrawalException e) {
            markFailed(withdrawal, e.getMessage());
            throw e;
        } catch (Exception e) {
            markFailed(withdrawal, e.getMessage());
            throw new EthWithdrawalException("Failed to sign transaction", e);
        }
    }

    @Override
    public EthWithdrawal broadcast(Long uid, Long withdrawalId) {
        EthWithdrawal withdrawal = findWithdrawal(uid, withdrawalId);
        if (!STATUS_SIGNED.equals(withdrawal.getStatus())) {
            throw new EthWithdrawalException("Only SIGNED withdrawal can be broadcast");
        }
        if (withdrawal.getSignedRawTx() == null || withdrawal.getSignedRawTx().isBlank()) {
            throw new EthWithdrawalException("signedRawTx is missing, please sign first");
        }

        try {
            return broadcastStage(withdrawal, withdrawal.getSignedRawTx());
        } catch (EthWithdrawalException e) {
            markFailed(withdrawal, e.getMessage());
            throw e;
        } catch (Exception e) {
            markFailed(withdrawal, e.getMessage());
            throw new EthWithdrawalException("Failed to broadcast transaction", e);
        }
    }

    @Override
    public List<EthWithdrawal> listByUid(Long uid) {
        return ethWithdrawalRepository.findByUidOrderByCreateTimeDesc(uid);
    }

    private BigInteger toWei(BigDecimal amountEth) {
        try {
            return Convert.toWei(amountEth, Convert.Unit.ETHER).toBigIntegerExact();
        } catch (ArithmeticException e) {
            throw new EthWithdrawalException("amountEth has too many decimal places", e);
        }
    }

    private String truncate(String message) {
        if (message == null) {
            return null;
        }
        if (message.length() <= MAX_ERROR_MESSAGE_LENGTH) {
            return message;
        }
        return message.substring(0, MAX_ERROR_MESSAGE_LENGTH);
    }

    private BuildStageResult buildStage(Long uid, Long fromWalletId, String toAddress, BigDecimal amountEth) {
        validateRequest(uid, fromWalletId, toAddress, amountEth);

        EthWallet fromWallet = ethWalletRepository.findByIdAndUid(fromWalletId, uid)
            .orElseThrow(() -> new EthWithdrawalException("Selected from address does not exist for this uid"));
        if (!WalletUtils.isValidAddress(fromWallet.getAddress())) {
            throw new EthWithdrawalException("from address in database is invalid");
        }

        BigInteger amountWei = toWei(amountEth);
        BigInteger nonce = ethereumChainService.getPendingNonce(fromWallet.getAddress());
        BigInteger gasLimit = ethereumChainService.estimateGasForEthTransfer(
            fromWallet.getAddress(), toAddress, amountWei
        );
        EthereumChainService.FeeSuggestion feeSuggestion = ethereumChainService.suggestEip1559Fees();

        RawTransaction rawTransaction = RawTransaction.createEtherTransaction(
            ethereumChainService.chainId(),
            nonce,
            gasLimit,
            toAddress,
            amountWei,
            feeSuggestion.maxPriorityFeePerGas(),
            feeSuggestion.maxFeePerGas()
        );

        EthWithdrawal withdrawal = new EthWithdrawal(
            uid,
            fromWalletId,
            fromWallet.getAddress(),
            toAddress,
            amountWei.toString(),
            nonce.toString(),
            gasLimit.toString(),
            feeSuggestion.maxPriorityFeePerGas().toString(),
            feeSuggestion.maxFeePerGas().toString()
        );
        withdrawal.setStatus(STATUS_BUILT);
        withdrawal = ethWithdrawalRepository.save(withdrawal);

        return new BuildStageResult(withdrawal, rawTransaction, fromWallet.getPrivateKey());
    }

    private SignStageResult signStage(EthWithdrawal withdrawal, RawTransaction rawTransaction, String privateKeyHex) {
        Credentials credentials = Credentials.create(Numeric.cleanHexPrefix(privateKeyHex));
        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, credentials);
        String signedRawTxHex = Numeric.toHexString(signedMessage);

        withdrawal.setStatus(STATUS_SIGNED);
        ethWithdrawalRepository.save(withdrawal);

        return new SignStageResult(signedRawTxHex);
    }

    private EthWithdrawal broadcastStage(EthWithdrawal withdrawal, String signedRawTxHex) {
        String txHash = ethereumChainService.sendRawTransaction(signedRawTxHex);
        withdrawal.setStatus(STATUS_SUBMITTED);
        withdrawal.setTxHash(txHash);
        withdrawal.setErrorMessage(null);
        return ethWithdrawalRepository.save(withdrawal);
    }

    private void validateRequest(Long uid, Long fromWalletId, String toAddress, BigDecimal amountEth) {
        if (uid == null || uid <= 0) {
            throw new EthWithdrawalException("uid must be a positive number");
        }
        if (fromWalletId == null || fromWalletId <= 0) {
            throw new EthWithdrawalException("fromWalletId must be a positive number");
        }
        if (toAddress == null || !WalletUtils.isValidAddress(toAddress)) {
            throw new EthWithdrawalException("toAddress is not a valid ethereum address");
        }
        if (amountEth == null || amountEth.compareTo(BigDecimal.ZERO) <= 0) {
            throw new EthWithdrawalException("amountEth must be a positive number");
        }
    }

    private void markFailed(EthWithdrawal withdrawal, String message) {
        if (withdrawal == null) {
            return;
        }
        withdrawal.setStatus(STATUS_FAILED);
        withdrawal.setErrorMessage(truncate(message));
        ethWithdrawalRepository.save(withdrawal);
    }

    private record BuildStageResult(EthWithdrawal withdrawal, RawTransaction rawTransaction, String privateKeyHex) {
    }

    private record SignStageResult(String signedRawTxHex) {
    }

    private EthWithdrawal findWithdrawal(Long uid, Long withdrawalId) {
        if (uid == null || uid <= 0) {
            throw new EthWithdrawalException("uid must be a positive number");
        }
        if (withdrawalId == null || withdrawalId <= 0) {
            throw new EthWithdrawalException("withdrawalId must be a positive number");
        }
        return ethWithdrawalRepository.findByIdAndUid(withdrawalId, uid)
            .orElseThrow(() -> new EthWithdrawalException("Withdrawal record not found for this uid"));
    }

    private RawTransaction buildRawTransactionFromWithdrawal(EthWithdrawal withdrawal) {
        return RawTransaction.createEtherTransaction(
            ethereumChainService.chainId(),
            parseBigInteger(withdrawal.getNonceValue(), "nonceValue"),
            parseBigInteger(withdrawal.getGasLimit(), "gasLimit"),
            withdrawal.getToAddress(),
            parseBigInteger(withdrawal.getAmountWei(), "amountWei"),
            parseBigInteger(withdrawal.getMaxPriorityFeePerGas(), "maxPriorityFeePerGas"),
            parseBigInteger(withdrawal.getMaxFeePerGas(), "maxFeePerGas")
        );
    }

    private BigInteger parseBigInteger(String value, String fieldName) {
        try {
            return new BigInteger(value);
        } catch (Exception e) {
            throw new EthWithdrawalException("Invalid numeric field: " + fieldName, e);
        }
    }
}
