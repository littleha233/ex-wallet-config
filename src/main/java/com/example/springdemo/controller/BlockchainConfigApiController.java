package com.example.springdemo.controller;

import com.example.springdemo.biz.BlockchainConfigBiz;
import com.example.springdemo.domain.BlockchainConfig;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/blockchain-configs")
public class BlockchainConfigApiController {
    private final BlockchainConfigBiz blockchainConfigBiz;

    public BlockchainConfigApiController(BlockchainConfigBiz blockchainConfigBiz) {
        this.blockchainConfigBiz = blockchainConfigBiz;
    }

    @GetMapping
    public List<BlockchainConfig> list(@RequestParam(required = false) Boolean enabled) {
        return blockchainConfigBiz.list(enabled);
    }

    @PostMapping
    public BlockchainConfig create(@RequestBody SaveBlockchainConfigRequest request) {
        return blockchainConfigBiz.create(
            request.blockchainId(),
            request.chainCode(),
            request.chainName(),
            request.enabled()
        );
    }

    @PutMapping("/{id}")
    public BlockchainConfig update(@PathVariable Long id, @RequestBody SaveBlockchainConfigRequest request) {
        return blockchainConfigBiz.update(
            id,
            request.blockchainId(),
            request.chainCode(),
            request.chainName(),
            request.enabled()
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(e.getMessage()));
    }

    public record SaveBlockchainConfigRequest(
        Integer blockchainId,
        String chainCode,
        String chainName,
        Boolean enabled
    ) {
    }

    public record ErrorResponse(String message) {
    }
}
