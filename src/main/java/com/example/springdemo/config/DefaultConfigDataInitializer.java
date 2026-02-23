package com.example.springdemo.config;

import com.example.springdemo.domain.BlockchainConfig;
import com.example.springdemo.domain.Coin;
import com.example.springdemo.domain.CoinChainConfig;
import com.example.springdemo.repository.BlockchainConfigRepository;
import com.example.springdemo.repository.CoinChainConfigRepository;
import com.example.springdemo.repository.CoinRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@Profile("!prod")
public class DefaultConfigDataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DefaultConfigDataInitializer.class);

    private final CoinRepository coinRepository;
    private final BlockchainConfigRepository blockchainConfigRepository;
    private final CoinChainConfigRepository coinChainConfigRepository;

    @Value("${app.bootstrap.seed-default-config-data:true}")
    private boolean seedDefaultConfigData;

    public DefaultConfigDataInitializer(CoinRepository coinRepository,
                                        BlockchainConfigRepository blockchainConfigRepository,
                                        CoinChainConfigRepository coinChainConfigRepository) {
        this.coinRepository = coinRepository;
        this.blockchainConfigRepository = blockchainConfigRepository;
        this.coinChainConfigRepository = coinChainConfigRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedDefaultConfigData) {
            log.info("skip default config data bootstrap because app.bootstrap.seed-default-config-data=false");
            return;
        }

        Coin usdt = ensureCoin(1, "USDT", "Tether USD", 6);
        Coin usdc = ensureCoin(2, "USDC", "Circle USD", 6);
        BlockchainConfig eth = ensureBlockchain(0, "ETH", "Ethereum");
        BlockchainConfig bsc = ensureBlockchain(1, "BSC", "Binance Smart Chain");

        ensureCoinChainConfig(
            usdt,
            eth,
            "https://eth.llamarpc.com",
            "0x0000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000002",
            new BigDecimal("10"),
            6,
            new BigDecimal("1"),
            6,
            "{\"network\":\"mainnet\",\"tokenStandard\":\"ERC20\"}"
        );
        ensureCoinChainConfig(
            usdc,
            bsc,
            "https://bsc-dataseed.binance.org",
            "0x0000000000000000000000000000000000000003",
            "0x0000000000000000000000000000000000000004",
            new BigDecimal("1"),
            6,
            new BigDecimal("0.1"),
            6,
            "{\"network\":\"mainnet\",\"tokenStandard\":\"BEP20\"}"
        );
    }

    private Coin ensureCoin(int coinId, String symbol, String fullName, int precision) {
        Optional<Coin> existing = coinRepository.findByCoinId(coinId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Coin coin = new Coin(coinId, symbol, fullName, precision, null, Boolean.TRUE);
        Coin saved = coinRepository.save(coin);
        log.info("bootstrapped default coin: id={}, coinId={}, symbol={}", saved.getId(), saved.getCoinId(), saved.getSymbol());
        return saved;
    }

    private BlockchainConfig ensureBlockchain(int blockchainId, String chainCode, String chainName) {
        Optional<BlockchainConfig> existing = blockchainConfigRepository.findByBlockchainId(blockchainId);
        if (existing.isPresent()) {
            return existing.get();
        }
        existing = blockchainConfigRepository.findByChainCodeIgnoreCase(chainCode);
        if (existing.isPresent()) {
            return existing.get();
        }

        BlockchainConfig blockchain = new BlockchainConfig(blockchainId, chainCode, chainName, Boolean.TRUE);
        BlockchainConfig saved = blockchainConfigRepository.save(blockchain);
        log.info(
            "bootstrapped default blockchain config: id={}, blockchainId={}, chainCode={}",
            saved.getId(),
            saved.getBlockchainId(),
            saved.getChainCode()
        );
        return saved;
    }

    private void ensureCoinChainConfig(Coin coin, BlockchainConfig blockchain, String rpcUrl,
                                       String collectionAddress, String withdrawAddress,
                                       BigDecimal minWithdrawAmount, int withdrawPrecision,
                                       BigDecimal minDepositAmount, int depositPrecision, String extraJson) {
        if (coinChainConfigRepository.existsByCoinIdAndBlockchainId(coin.getId(), blockchain.getBlockchainId())) {
            return;
        }

        CoinChainConfig config = new CoinChainConfig(
            coin.getId(),
            blockchain.getBlockchainId(),
            blockchain.getChainCode(),
            blockchain.getChainName(),
            rpcUrl,
            collectionAddress,
            withdrawAddress,
            minWithdrawAmount,
            withdrawPrecision,
            minDepositAmount,
            depositPrecision,
            extraJson,
            Boolean.TRUE
        );
        CoinChainConfig saved = coinChainConfigRepository.save(config);
        log.info(
            "bootstrapped default coin-chain config: id={}, coinId={}, blockchainId={}",
            saved.getId(),
            saved.getCoinId(),
            saved.getBlockchainId()
        );
    }
}
