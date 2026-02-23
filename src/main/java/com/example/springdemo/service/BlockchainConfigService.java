package com.example.springdemo.service;

import com.example.springdemo.biz.BlockchainConfigBiz;
import com.example.springdemo.common.error.BusinessException;
import com.example.springdemo.common.error.ErrorCode;
import com.example.springdemo.common.logging.LogContext;
import com.example.springdemo.domain.BlockchainConfig;
import com.example.springdemo.domain.CoinChainConfig;
import com.example.springdemo.repository.BlockchainConfigRepository;
import com.example.springdemo.repository.CoinChainConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BlockchainConfigService implements BlockchainConfigBiz {
    private static final Logger log = LoggerFactory.getLogger(BlockchainConfigService.class);

    private final BlockchainConfigRepository blockchainConfigRepository;
    private final CoinChainConfigRepository coinChainConfigRepository;

    public BlockchainConfigService(BlockchainConfigRepository blockchainConfigRepository,
                                   CoinChainConfigRepository coinChainConfigRepository) {
        this.blockchainConfigRepository = blockchainConfigRepository;
        this.coinChainConfigRepository = coinChainConfigRepository;
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
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "blockchainId already exists");
        }
        if (blockchainConfigRepository.existsByChainCodeIgnoreCase(normalizedChainCode)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "chainCode already exists");
        }

        BlockchainConfig blockchainConfig = new BlockchainConfig(
            normalizedBlockchainId,
            normalizedChainCode,
            normalizedChainName,
            enabled == null ? Boolean.TRUE : enabled
        );
        BlockchainConfig saved = blockchainConfigRepository.save(blockchainConfig);
        log.info(
            "business traceId={} userId={} operation=create_blockchain_config details=id:{},blockchainId:{},chainCode:{} result=SUCCESS",
            LogContext.traceId(),
            LogContext.currentUserId(),
            saved.getId(),
            saved.getBlockchainId(),
            saved.getChainCode()
        );
        log.info(
            "audit traceId={} userId={} action=create_blockchain_config target=blockchainId:{}",
            LogContext.traceId(),
            LogContext.currentUserId(),
            saved.getBlockchainId()
        );
        return saved;
    }

    @Override
    @Transactional
    public BlockchainConfig update(Long id, Integer blockchainId, String chainCode, String chainName, Boolean enabled) {
        validatePositiveId(id, "id");
        BlockchainConfig blockchainConfig = blockchainConfigRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "blockchain config not found"));

        int normalizedBlockchainId = validateBlockchainId(blockchainId);
        String normalizedChainCode = requireText(chainCode, "chainCode").toUpperCase();
        String normalizedChainName = requireText(chainName, "chainName");

        if (blockchainConfigRepository.existsByBlockchainIdAndIdNot(normalizedBlockchainId, id)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "blockchainId already exists");
        }
        if (blockchainConfigRepository.existsByChainCodeIgnoreCaseAndIdNot(normalizedChainCode, id)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "chainCode already exists");
        }

        String previousChainCode = blockchainConfig.getChainCode();
        blockchainConfig.setBlockchainId(normalizedBlockchainId);
        blockchainConfig.setChainCode(normalizedChainCode);
        blockchainConfig.setChainName(normalizedChainName);
        blockchainConfig.setEnabled(enabled == null ? Boolean.TRUE : enabled);
        BlockchainConfig saved = blockchainConfigRepository.save(blockchainConfig);
        int affectedRows = syncCoinChainConfigsByChainCode(previousChainCode, saved);
        log.info(
            "business traceId={} userId={} operation=update_blockchain_config details=id:{},blockchainId:{},chainCode:{},syncCoinChainRows:{} result=SUCCESS",
            LogContext.traceId(),
            LogContext.currentUserId(),
            saved.getId(),
            saved.getBlockchainId(),
            saved.getChainCode(),
            affectedRows
        );
        log.info(
            "audit traceId={} userId={} action=update_blockchain_config target=blockchainId:{}",
            LogContext.traceId(),
            LogContext.currentUserId(),
            saved.getBlockchainId()
        );
        return saved;
    }

    private int syncCoinChainConfigsByChainCode(String previousChainCode, BlockchainConfig saved) {
        if (previousChainCode == null || previousChainCode.trim().isEmpty()) {
            return 0;
        }

        List<CoinChainConfig> relatedConfigs = coinChainConfigRepository.findByChainCodeIgnoreCase(previousChainCode);
        if (relatedConfigs.isEmpty()) {
            return 0;
        }

        for (CoinChainConfig config : relatedConfigs) {
            config.setBlockchainId(saved.getBlockchainId());
            config.setChainCode(saved.getChainCode());
            config.setChainName(saved.getChainName());
        }
        coinChainConfigRepository.saveAll(relatedConfigs);
        return relatedConfigs.size();
    }

    private int validateBlockchainId(Integer blockchainId) {
        if (blockchainId == null || blockchainId < 0) {
            throw new BusinessException(ErrorCode.INVALID_ARGUMENT, "blockchainId must be a non-negative integer");
        }
        return blockchainId;
    }

    private String requireText(String value, String field) {
        if (value == null || value.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_ARGUMENT, field + " is required");
        }
        return value.trim();
    }

    private void validatePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.INVALID_ARGUMENT, fieldName + " must be a positive number");
        }
    }
}
