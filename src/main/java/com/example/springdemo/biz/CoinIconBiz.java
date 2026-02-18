package com.example.springdemo.biz;

import org.springframework.web.multipart.MultipartFile;

public interface CoinIconBiz {
    String upload(MultipartFile file);
}
