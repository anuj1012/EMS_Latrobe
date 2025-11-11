package com.company.leaveapproval.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Register JavaTimeModule for LocalDateTime support
        mapper.registerModule(new JavaTimeModule());
        
        // Configure date/time serialization
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        
        // Allow flexible date parsing
        mapper.configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true);
        mapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        
        // Custom LocalDateTime handling
        SimpleModule localDateTimeModule = new SimpleModule();
        
        // Custom deserializer that handles both with and without timezone
        localDateTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer() {
            @Override
            public LocalDateTime deserialize(com.fasterxml.jackson.core.JsonParser p, 
                                          com.fasterxml.jackson.databind.DeserializationContext ctxt) 
                                          throws java.io.IOException {
                String dateTimeString = p.getValueAsString();
                if (dateTimeString == null || dateTimeString.trim().isEmpty()) {
                    return null;
                }
                
                try {
                    // Try parsing as ISO-8601 with timezone first
                    if (dateTimeString.contains("T") && (dateTimeString.endsWith("Z") || dateTimeString.contains("+"))) {
                        java.time.Instant instant = java.time.Instant.parse(dateTimeString);
                        return LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                    }
                    // Try parsing as LocalDateTime without timezone (e.g., "2025-10-07T10:27:44")
                    return LocalDateTime.parse(dateTimeString);
                } catch (DateTimeParseException e) {
                    // Fallback: try to parse as Instant and convert to local time
                    try {
                        java.time.Instant instant = java.time.Instant.parse(dateTimeString);
                        return LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                    } catch (Exception e2) {
                        throw new RuntimeException("Unable to parse LocalDateTime: " + dateTimeString, e2);
                    }
                }
            }
        });
        
        // Standard serializer
        localDateTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
        ));
        
        mapper.registerModule(localDateTimeModule);
        
        return mapper;
    }
}