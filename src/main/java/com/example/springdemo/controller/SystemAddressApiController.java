package com.example.springdemo.controller;

import com.example.springdemo.biz.SystemAddressBiz;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system-addresses")
public class SystemAddressApiController {
    private final SystemAddressBiz systemAddressBiz;

    public SystemAddressApiController(SystemAddressBiz systemAddressBiz) {
        this.systemAddressBiz = systemAddressBiz;
    }

    @PostMapping("/generate")
    public SystemAddressBiz.GenerateSystemAddressResponse generate(@RequestBody GenerateSystemAddressRequest request) {
        return systemAddressBiz.generate(request.coinId(), request.blockchainId());
    }

    public record GenerateSystemAddressRequest(
        Integer coinId,
        Integer blockchainId
    ) {
    }
}
