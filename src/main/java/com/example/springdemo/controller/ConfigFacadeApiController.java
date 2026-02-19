package com.example.springdemo.controller;

import com.example.springdemo.biz.ConfigFacadeBiz;
import com.example.springdemo.facade.dto.CoinChainConfigResponse;
import com.example.springdemo.facade.dto.FacadeErrorResponse;
import com.example.springdemo.facade.dto.QueryCoinChainConfigRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/facade/config")
public class ConfigFacadeApiController {
    private final ConfigFacadeBiz configFacadeBiz;

    public ConfigFacadeApiController(ConfigFacadeBiz configFacadeBiz) {
        this.configFacadeBiz = configFacadeBiz;
    }

    @GetMapping("/coin-chain")
    public ResponseEntity<CoinChainConfigResponse> queryCoinChainConfig(QueryCoinChainConfigRequest request) {
        Optional<CoinChainConfigResponse> result =
            configFacadeBiz.queryCoinChainConfig(request.getCoinId(), request.getBlockchainId());
        if (result.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(result.get());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<FacadeErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new FacadeErrorResponse(e.getMessage()));
    }
}
