package com.example.springdemo.facade.dto;

import lombok.Data;

@Data
public class QueryCoinChainConfigRequest {

    private Integer coinId;
    private Integer blockchainId;

}
