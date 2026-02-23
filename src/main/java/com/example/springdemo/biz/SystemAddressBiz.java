package com.example.springdemo.biz;

public interface SystemAddressBiz {
    GenerateSystemAddressResponse generate(Integer coinId, Integer blockchainId);

    record GenerateSystemAddressResponse(
        Integer coinId,
        Integer blockchainId,
        String address
    ) {
    }
}
