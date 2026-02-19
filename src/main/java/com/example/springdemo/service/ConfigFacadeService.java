package com.example.springdemo.service;

import com.example.springdemo.biz.ConfigFacadeBiz;
import com.example.springdemo.domain.Coin;
import com.example.springdemo.domain.CoinChainConfig;
import com.example.springdemo.facade.dto.CoinChainConfigResponse;
import com.example.springdemo.repository.CoinChainConfigRepository;
import com.example.springdemo.repository.CoinRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ConfigFacadeService implements ConfigFacadeBiz {
    private final CoinRepository coinRepository;
    private final CoinChainConfigRepository coinChainConfigRepository;

    public ConfigFacadeService(CoinRepository coinRepository, CoinChainConfigRepository coinChainConfigRepository) {
        this.coinRepository = coinRepository;
        this.coinChainConfigRepository = coinChainConfigRepository;
    }

    @Override
    public Optional<CoinChainConfigResponse> queryCoinChainConfig(Integer coinId, Integer blockchainId) {
        validateNonNegative(coinId, "coinId");
        validateNonNegative(blockchainId, "blockchainId");

        Optional<Coin> coinOptional = coinRepository.findByCoinId(coinId);
        if (coinOptional.isEmpty()) {
            return Optional.empty();
        }
        Coin coin = coinOptional.get();

        Optional<CoinChainConfig> configOptional = coinChainConfigRepository.findByCoinIdAndBlockchainId(coin.getId(), blockchainId);
        if (configOptional.isEmpty()) {
            return Optional.empty();
        }
        CoinChainConfig config = configOptional.get();

        CoinChainConfigResponse response = new CoinChainConfigResponse();
        response.setId(config.getId());
        response.setCoinId(config.getCoinId());
        response.setBlockchainId(config.getBlockchainId());
        response.setChainCode(config.getChainCode());
        response.setChainName(config.getChainName());
        response.setRpcUrl(config.getRpcUrl());
        response.setCollectionAddress(config.getCollectionAddress());
        response.setWithdrawAddress(config.getWithdrawAddress());
        response.setMinWithdrawAmount(config.getMinWithdrawAmount());
        response.setWithdrawPrecision(config.getWithdrawPrecision());
        response.setMinDepositAmount(config.getMinDepositAmount());
        response.setDepositPrecision(config.getDepositPrecision());
        response.setExtraJson(config.getExtraJson());
        response.setEnabled(config.getEnabled());
        response.setCreateTime(config.getCreateTime());
        response.setUpdateTime(config.getUpdateTime());
        return Optional.of(response);
    }

    private void validateNonNegative(Integer value, String field) {
        if (value == null || value < 0) {
            throw new IllegalArgumentException(field + " must be a non-negative integer");
        }
    }
}
