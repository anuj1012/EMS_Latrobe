package com.company.leaveapproval.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        
        // Build JDBC URL with timezone parameter
        String jdbcUrlWithTimezone = jdbcUrl + "&timezone=UTC&serverTimezone=UTC&logUnclosedConnections=true";
        config.setJdbcUrl(jdbcUrlWithTimezone);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        
        // Additional PostgreSQL specific properties
        config.addDataSourceProperty("useSSL", "false");
        config.addDataSourceProperty("characterEncoding", "utf8");
        config.addDataSourceProperty("useUnicode", "true");
        config.addDataSourceProperty("prepareThreshold", "0");
        config.addDataSourceProperty("preparedStatementCacheQueries", "0");
        config.addDataSourceProperty("preparedStatementCacheSizeMiB", "0");
        
        return new HikariDataSource(config);
    }
}
