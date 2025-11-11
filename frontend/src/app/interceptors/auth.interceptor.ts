import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  console.log('Auth Interceptor - Request URL:', req.url);
  console.log('Auth Interceptor - Token:', token);
  
  // Add authorization header for all API requests
  if (token && req.url.includes('/api/')) {
    console.log('Auth Interceptor - Adding Authorization header');
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  
  return next(req);
};