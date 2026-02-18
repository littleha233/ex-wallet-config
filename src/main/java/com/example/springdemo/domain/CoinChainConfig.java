package com.example.springdemo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "coin_chain_config",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_coin_chain_config_coin_chain", columnNames = {"coin_id", "chain_code"})
    }
)
@Data
public class CoinChainConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coin_id", nullable = false)
    private Long coinId;

    @Column(name = "chain_code", nullable = false, length = 32)
    private String chainCode;

    @Column(name = "rpc_url", nullable = false, length = 512)
    private String rpcUrl;

    @Column(name = "collection_address", nullable = false, length = 128)
    private String collectionAddress;

    @Column(name = "withdraw_address", nullable = false, length = 128)
    private String withdrawAddress;

    @Column(name = "min_withdraw_amount", nullable = false, precision = 38, scale = 18)
    private BigDecimal minWithdrawAmount;

    @Column(name = "withdraw_precision", nullable = false)
    private Integer withdrawPrecision;

    @Column(name = "min_deposit_amount", nullable = false, precision = 38, scale = 18)
    private BigDecimal minDepositAmount;

    @Column(name = "deposit_precision", nullable = false)
    private Integer depositPrecision;

    @Column(name = "extra_json", nullable = false, length = 4000)
    private String extraJson;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "create_time")
    private Instant createTime;

    @Column(name = "update_time")
    private Instant updateTime;

    protected CoinChainConfig() {
        // for JPA
    }

    public CoinChainConfig(Long coinId, String chainCode, String rpcUrl, String collectionAddress,
                           String withdrawAddress, BigDecimal minWithdrawAmount, Integer withdrawPrecision,
                           BigDecimal minDepositAmount, Integer depositPrecision, String extraJson, Boolean enabled) {
        this.coinId = coinId;
        this.chainCode = chainCode;
        this.rpcUrl = rpcUrl;
        this.collectionAddress = collectionAddress;
        this.withdrawAddress = withdrawAddress;
        this.minWithdrawAmount = minWithdrawAmount;
        this.withdrawPrecision = withdrawPrecision;
        this.minDepositAmount = minDepositAmount;
        this.depositPrecision = depositPrecision;
        this.extraJson = extraJson;
        this.enabled = enabled;
    }

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        if (createTime == null) {
            createTime = now;
        }
        updateTime = now;
        if (enabled == null) {
            enabled = Boolean.TRUE;
        }
        if (extraJson == null || extraJson.trim().isEmpty()) {
            extraJson = "{}";
        }
    }

    @PreUpdate
    public void onUpdate() {
        updateTime = Instant.now();
    }
}
