package com.example.springdemo.service;

import com.example.springdemo.biz.SystemAddressBiz;
import com.example.springdemo.common.error.BusinessException;
import com.example.springdemo.common.error.ErrorCode;
import com.example.springdemo.common.error.IntegrationException;
import com.example.springdemo.common.logging.LogContext;
import com.example.springdemo.config.SystemAddressGeneratorProperties;
import com.example.springdemo.domain.Coin;
import com.example.springdemo.repository.CoinChainConfigRepository;
import com.example.springdemo.repository.CoinRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class SystemAddressService implements SystemAddressBiz {
    private static final Logger log = LoggerFactory.getLogger(SystemAddressService.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final CoinRepository coinRepository;
    private final CoinChainConfigRepository coinChainConfigRepository;
    private final SystemAddressGeneratorProperties properties;
    private final RestClient restClient;

    public SystemAddressService(CoinRepository coinRepository,
                                CoinChainConfigRepository coinChainConfigRepository,
                                SystemAddressGeneratorProperties properties,
                                RestClient.Builder restClientBuilder) {
        this.coinRepository = coinRepository;
        this.coinChainConfigRepository = coinChainConfigRepository;
        this.properties = properties;
        this.restClient = restClientBuilder
            .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
            .build();
    }

    @Override
    public GenerateSystemAddressResponse generate(Integer coinId, Integer blockchainId) {
        int normalizedCoinId = validateNonNegative(coinId, "coinId");
        int normalizedBlockchainId = validateNonNegative(blockchainId, "blockchainId");
        validateCoinChainConfigExists(normalizedCoinId, normalizedBlockchainId);

        if (!properties.isEnabled()) {
            throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION, "system address generator is disabled");
        }

        String responseText = callAddressGenerator(normalizedCoinId, normalizedBlockchainId);
        String address = extractAddress(responseText);
        if (address == null || address.isBlank()) {
            throw new IntegrationException(ErrorCode.INTEGRATION_IO_ERROR, "address generator response does not contain address");
        }

        log.info(
            "business traceId={} userId={} operation=generate_system_address details=coinId:{},blockchainId:{} result=SUCCESS",
            LogContext.traceId(),
            LogContext.currentUserId(),
            normalizedCoinId,
            normalizedBlockchainId
        );
        log.info(
            "audit traceId={} userId={} action=generate_system_address target=coinId:{},blockchainId:{}",
            LogContext.traceId(),
            LogContext.currentUserId(),
            normalizedCoinId,
            normalizedBlockchainId
        );
        return new GenerateSystemAddressResponse(normalizedCoinId, normalizedBlockchainId, address);
    }

    private void validateCoinChainConfigExists(int coinId, int blockchainId) {
        Coin coin = coinRepository.findByCoinId(coinId)
            .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "coin not found for coinId"));
        coinChainConfigRepository.findByCoinIdAndBlockchainId(coin.getId(), blockchainId)
            .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "coin-chain config not found for coinId and blockchainId"));
    }

    private int validateNonNegative(Integer value, String fieldName) {
        if (value == null || value < 0) {
            throw new BusinessException(ErrorCode.INVALID_ARGUMENT, fieldName + " must be a non-negative integer");
        }
        return value;
    }

    private String callAddressGenerator(int coinId, int blockchainId) {
        String generatePath = normalizePath(properties.getGeneratePath());
        try {
            return restClient
                .post()
                .uri(generatePath)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new GenerateAddressProviderRequest(coinId, blockchainId))
                .retrieve()
                .body(String.class);
        } catch (RestClientResponseException exception) {
            throw new IntegrationException(
                ErrorCode.INTEGRATION_IO_ERROR,
                "address generator call failed with status " + exception.getRawStatusCode(),
                exception
            );
        } catch (RestClientException exception) {
            throw new IntegrationException(
                ErrorCode.INTEGRATION_IO_ERROR,
                "address generator service is unavailable",
                exception
            );
        }
    }

    private String extractAddress(String responseText) {
        if (responseText == null || responseText.isBlank()) {
            return null;
        }
        String trimmed = responseText.trim();
        try {
            JsonNode root = OBJECT_MAPPER.readTree(trimmed);
            String directAddress = textNode(root, "address");
            if (directAddress != null && !directAddress.isBlank()) {
                return directAddress;
            }
            JsonNode data = root.path("data");
            String dataAddress = textNode(data, "address");
            if (dataAddress != null && !dataAddress.isBlank()) {
                return dataAddress;
            }
            JsonNode result = root.path("result");
            String resultAddress = textNode(result, "address");
            if (resultAddress != null && !resultAddress.isBlank()) {
                return resultAddress;
            }
            return null;
        } catch (Exception exception) {
            // tolerate plain-text address format from external services
            return trimmed;
        }
    }

    private String textNode(JsonNode node, String fieldName) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        JsonNode child = node.get(fieldName);
        if (child == null || child.isNull()) {
            return null;
        }
        return child.asText(null);
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_ARGUMENT, "system.address-generator.base-url is required");
        }
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String normalizePath(String value) {
        if (value == null || value.isBlank()) {
            return "/";
        }
        String trimmed = value.trim();
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }

    private record GenerateAddressProviderRequest(Integer coinId, Integer blockchainId) {
    }
}
