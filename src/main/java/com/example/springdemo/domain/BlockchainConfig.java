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

import java.time.Instant;

@Entity
@Table(
    name = "blockchain_config",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_blockchain_config_blockchain_id", columnNames = "blockchain_id"),
        @UniqueConstraint(name = "uk_blockchain_config_chain_code", columnNames = "chain_code")
    }
)
@Data
public class BlockchainConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "blockchain_id", nullable = false)
    private Integer blockchainId;

    @Column(name = "chain_code", nullable = false, length = 32)
    private String chainCode;

    @Column(name = "chain_name", nullable = false, length = 128)
    private String chainName;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "create_time")
    private Instant createTime;

    @Column(name = "update_time")
    private Instant updateTime;

    protected BlockchainConfig() {
        // for JPA
    }

    public BlockchainConfig(Integer blockchainId, String chainCode, String chainName, Boolean enabled) {
        this.blockchainId = blockchainId;
        this.chainCode = chainCode;
        this.chainName = chainName;
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
    }

    @PreUpdate
    public void onUpdate() {
        updateTime = Instant.now();
    }
}
