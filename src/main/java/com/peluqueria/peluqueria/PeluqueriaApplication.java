package com.peluqueria.peluqueria;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAspectJAutoProxy

public class PeluqueriaApplication {

    public static void main(String[] args) {
        SpringApplication.run(PeluqueriaApplication.class, args);
    }
}