package com.example.springdemo.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "coin.icon")
@Getter
@Setter
public class CoinIconProperties {
    private String uploadDir;
    private String publicPath;
    private Long maxSizeKb;
}
