package com.example.springdemo.biz;

import com.example.springdemo.facade.dto.CoinChainConfigResponse;

import java.util.Optional;

public interface ConfigFacadeBiz {
    Optional<CoinChainConfigResponse> queryCoinChainConfig(Integer coinId, Integer blockchainId);
}
