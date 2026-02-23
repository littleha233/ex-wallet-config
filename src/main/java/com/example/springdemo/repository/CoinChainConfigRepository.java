package com.example.springdemo.repository;

import com.example.springdemo.domain.CoinChainConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CoinChainConfigRepository extends JpaRepository<CoinChainConfig, Long> {
    List<CoinChainConfig> findByCoinIdOrderByIdDesc(Long coinId);

    List<CoinChainConfig> findAllByOrderByIdDesc();

    List<CoinChainConfig> findByChainCodeIgnoreCase(String chainCode);

    boolean existsByCoinIdAndBlockchainId(Long coinId, Integer blockchainId);

    boolean existsByCoinIdAndBlockchainIdAndIdNot(Long coinId, Integer blockchainId, Long id);

    Optional<CoinChainConfig> findByCoinIdAndBlockchainId(Long coinId, Integer blockchainId);
}
