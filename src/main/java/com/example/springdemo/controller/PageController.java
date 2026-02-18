package com.example.springdemo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/eth-address")
    public String ethAddress() {
        return "eth-address";
    }

    @GetMapping("/eth-withdraw")
    public String ethWithdraw() {
        return "eth-withdraw";
    }

    @GetMapping("/coin-config")
    public String coinConfig() {
        return "coin-config";
    }

    @GetMapping("/coin-chain-config")
    public String coinChainConfig() {
        return "coin-chain-config";
    }
}
