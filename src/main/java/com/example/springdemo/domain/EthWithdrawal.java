package com.example.springdemo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Data;

@Entity
@Table(name = "eth_withdrawal")
@Data
public class EthWithdrawal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long uid;

    @Column(name = "from_wallet_id", nullable = false)
    private Long fromWalletId;

    @Column(name = "from_address", nullable = false, length = 42)
    private String fromAddress;

    @Column(name = "to_address", nullable = false, length = 42)
    private String toAddress;

    @Column(name = "amount_wei", nullable = false, length = 78)
    private String amountWei;

    @Column(name = "nonce_value", nullable = false, length = 78)
    private String nonceValue;

    @Column(name = "gas_limit", nullable = false, length = 78)
    private String gasLimit;

    @Column(name = "max_priority_fee_per_gas", nullable = false, length = 78)
    private String maxPriorityFeePerGas;

    @Column(name = "max_fee_per_gas", nullable = false, length = 78)
    private String maxFeePerGas;

    @Column(name = "signed_raw_tx", columnDefinition = "TEXT")
    private String signedRawTx;

    @Column(name = "tx_hash", length = 66)
    private String txHash;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "create_time")
    private Instant createTime;

    protected EthWithdrawal() {
        // for JPA
    }

    public EthWithdrawal(Long uid, Long fromWalletId, String fromAddress, String toAddress, String amountWei,
                         String nonceValue, String gasLimit, String maxPriorityFeePerGas, String maxFeePerGas) {
        this.uid = uid;
        this.fromWalletId = fromWalletId;
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amountWei = amountWei;
        this.nonceValue = nonceValue;
        this.gasLimit = gasLimit;
        this.maxPriorityFeePerGas = maxPriorityFeePerGas;
        this.maxFeePerGas = maxFeePerGas;
    }

    @PrePersist
    public void onCreate() {
        if (createTime == null) {
            createTime = Instant.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }
}
