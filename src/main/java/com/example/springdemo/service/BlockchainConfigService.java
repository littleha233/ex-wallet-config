package com.example.springdemo.service;

import com.example.springdemo.biz.BlockchainConfigBiz;
import com.example.springdemo.domain.BlockchainConfig;
import com.example.springdemo.repository.BlockchainConfigRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BlockchainConfigService implements BlockchainConfigBiz {
    private final BlockchainConfigRepository blockchainConfigRepository;

    public BlockchainConfigService(BlockchainConfigRepository blockchainConfigRepository) {
        this.blockchainConfigRepository = blockchainConfigRepository;
    }

    @Override
    public List<BlockchainConfig> list(Boolean enabled) {
        if (enabled == null) {
            return blockchainConfigRepository.findAllByOrderByIdDesc();
        }
        return blockchainConfigRepository.findByEnabledOrderByIdDesc(enabled);
    }

    @Override
    public BlockchainConfig create(Integer blockchainId, String chainCode, String chainName, Boolean enabled) {
        int normalizedBlockchainId = validateBlockchainId(blockchainId);
        String normalizedChainCode = requireText(chainCode, "chainCode").toUpperCase();
        String normalizedChainName = requireText(chainName, "chainName");

        if (blockchainConfigRepository.existsByBlockchainId(normalizedBlockchainId)) {
            throw new IllegalArgumentException("blockchainId already exists");
        }
        if (blockchainConfigRepository.existsByChainCodeIgnoreCase(normalizedChainCode)) {
            throw new IllegalArgumentException("chainCode already exists");
        }

        BlockchainConfig blockchainConfig = new BlockchainConfig(
            normalizedBlockchainId,
            normalizedChainCode,
            normalizedChainName,
            enabled == null ? Boolean.TRUE : enabled
        );
        return blockchainConfigRepository.save(blockchainConfig);
    }

    @Override
    public BlockchainConfig update(Long id, Integer blockchainId, String chainCode, String chainName, Boolean enabled) {
        validatePositiveId(id, "id");
        BlockchainConfig blockchainConfig = blockchainConfigRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("blockchain config not found"));

        int normalizedBlockchainId = validateBlockchainId(blockchainId);
        String normalizedChainCode = requireText(chainCode, "chainCode").toUpperCase();
        String normalizedChainName = requireText(chainName, "chainName");

        if (blockchainConfigRepository.existsByBlockchainIdAndIdNot(normalizedBlockchainId, id)) {
            throw new IllegalArgumentException("blockchainId already exists");
        }
        if (blockchainConfigRepository.existsByChainCodeIgnoreCaseAndIdNot(normalizedChainCode, id)) {
            throw new IllegalArgumentException("chainCode already exists");
        }

        blockchainConfig.setBlockchainId(normalizedBlockchainId);
        blockchainConfig.setChainCode(normalizedChainCode);
        blockchainConfig.setChainName(normalizedChainName);
        blockchainConfig.setEnabled(enabled == null ? Boolean.TRUE : enabled);
        return blockchainConfigRepository.save(blockchainConfig);
    }

    private int validateBlockchainId(Integer blockchainId) {
        if (blockchainId == null || blockchainId < 0) {
            throw new IllegalArgumentException("blockchainId must be a non-negative integer");
        }
        return blockchainId;
    }

    private String requireText(String value, String field) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    private void validatePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException(fieldName + " must be a positive number");
        }
    }
}
