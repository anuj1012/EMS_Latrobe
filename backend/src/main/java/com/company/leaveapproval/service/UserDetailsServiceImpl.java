package com.company.leaveapproval.service;

import com.company.leaveapproval.entity.User;
import com.company.leaveapproval.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalized = username == null ? null : username.trim().toLowerCase();
        logger.debug("Attempting to load user by email: {}", normalized);
        User user = userRepository.findByEmail(normalized)
                .orElseThrow(() -> {
                    logger.warn("User not found for email: {}", normalized);
                    return new UsernameNotFoundException("User Not Found: " + normalized);
                });
        logger.debug("User found: {} with role: {}", user.getEmail(), user.getRole());
        return user;
    }
}