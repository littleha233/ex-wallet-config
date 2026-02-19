package com.example.springdemo.facade.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class CoinChainConfigResponse {

    private Long id;
    private Long coinId;
    private Integer blockchainId;
    private String chainCode;
    private String chainName;
    private String rpcUrl;
    private String collectionAddress;
    private String withdrawAddress;
    private BigDecimal minWithdrawAmount;
    private Integer withdrawPrecision;
    private BigDecimal minDepositAmount;
    private Integer depositPrecision;
    private String extraJson;
    private Boolean enabled;
    private Instant createTime;
    private Instant updateTime;

}
