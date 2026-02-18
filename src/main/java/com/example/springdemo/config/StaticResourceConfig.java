package com.example.springdemo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    private final CoinIconProperties coinIconProperties;

    public StaticResourceConfig(CoinIconProperties coinIconProperties) {
        this.coinIconProperties = coinIconProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String publicPath = normalizePublicPath(coinIconProperties.getPublicPath());
        String uploadDir = coinIconProperties.getUploadDir();
        if (!StringUtils.hasText(uploadDir)) {
            throw new IllegalArgumentException("coin.icon.upload-dir is required");
        }

        Path absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String location = absolutePath.toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler(publicPath + "/**")
            .addResourceLocations(location);
    }

    private String normalizePublicPath(String publicPath) {
        if (!StringUtils.hasText(publicPath)) {
            throw new IllegalArgumentException("coin.icon.public-path is required");
        }
        String normalized = publicPath.trim();
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }
}
