package com.example.springdemo.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "system.address-generator")
@Getter
@Setter
public class SystemAddressGeneratorProperties {
    private boolean enabled = true;
    private String baseUrl = "http://127.0.0.1:8091";
    private String generatePath = "/api/system-addresses/generate";
}
