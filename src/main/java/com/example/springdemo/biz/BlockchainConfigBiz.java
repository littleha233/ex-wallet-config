package com.example.springdemo.biz;

import com.example.springdemo.domain.BlockchainConfig;

import java.util.List;

public interface BlockchainConfigBiz {
    List<BlockchainConfig> list(Boolean enabled);

    BlockchainConfig create(Integer blockchainId, String chainCode, String chainName, Boolean enabled);

    BlockchainConfig update(Long id, Integer blockchainId, String chainCode, String chainName, Boolean enabled);
}
