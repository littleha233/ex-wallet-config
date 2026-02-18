package com.example.springdemo.biz;

import com.example.springdemo.domain.CoinChainConfig;

import java.math.BigDecimal;
import java.util.List;

public interface CoinChainConfigBiz {
    List<CoinChainConfig> list(Long coinId);

    CoinChainConfig create(Long coinId, String chainCode, String rpcUrl, String collectionAddress, String withdrawAddress,
                           BigDecimal minWithdrawAmount, Integer withdrawPrecision,
                           BigDecimal minDepositAmount, Integer depositPrecision, String extraJson, Boolean enabled);

    CoinChainConfig update(Long id, Long coinId, String chainCode, String rpcUrl, String collectionAddress, String withdrawAddress,
                           BigDecimal minWithdrawAmount, Integer withdrawPrecision,
                           BigDecimal minDepositAmount, Integer depositPrecision, String extraJson, Boolean enabled);
}
