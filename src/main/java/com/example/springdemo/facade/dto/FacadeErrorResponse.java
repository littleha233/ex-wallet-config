package com.example.springdemo.facade.dto;

public class FacadeErrorResponse {
    private String message;

    public FacadeErrorResponse() {
    }

    public FacadeErrorResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
