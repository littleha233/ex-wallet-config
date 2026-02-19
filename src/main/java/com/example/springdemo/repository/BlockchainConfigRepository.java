package com.example.springdemo.repository;

import com.example.springdemo.domain.BlockchainConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlockchainConfigRepository extends JpaRepository<BlockchainConfig, Long> {
    List<BlockchainConfig> findAllByOrderByIdDesc();

    List<BlockchainConfig> findByEnabledOrderByIdDesc(Boolean enabled);

    boolean existsByBlockchainId(Integer blockchainId);

    boolean existsByBlockchainIdAndIdNot(Integer blockchainId, Long id);

    boolean existsByChainCodeIgnoreCase(String chainCode);

    boolean existsByChainCodeIgnoreCaseAndIdNot(String chainCode, Long id);

    Optional<BlockchainConfig> findByBlockchainId(Integer blockchainId);

    Optional<BlockchainConfig> findByChainCodeIgnoreCase(String chainCode);
}
