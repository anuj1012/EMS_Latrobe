package com.company.leaveapproval.service;

import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
public class MinIOService {

    @Autowired
    private MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    public void initializeBucket() {
        try {
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error initializing bucket: " + e.getMessage());
        }
    }

    public String uploadFile(MultipartFile file, String folder) {
        try {
            initializeBucket();
            
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            String objectName = folder + "/" + fileName;
            
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );
            
            return objectName;
        } catch (Exception e) {
            throw new RuntimeException("Error uploading file: " + e.getMessage());
        }
    }

    public String uploadBase64Image(String base64Data, String folder) {
        try {
            initializeBucket();
            
            String fileName = UUID.randomUUID().toString() + ".jpg";
            String objectName = folder + "/" + fileName;
            
            // Convert base64 to byte array
            byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data.split(",")[1]);
            
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(new java.io.ByteArrayInputStream(imageBytes), imageBytes.length, -1)
                    .contentType("image/jpeg")
                    .build()
            );
            
            return objectName;
        } catch (Exception e) {
            throw new RuntimeException("Error uploading base64 image: " + e.getMessage());
        }
    }

    public String getFileUrl(String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucketName)
                    .object(objectName)
                    .expiry(60 * 60 * 24) // 24 hours
                    .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Error getting file URL: " + e.getMessage());
        }
    }

    public InputStream getFile(String objectName) {
        try {
            return minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Error getting file: " + e.getMessage());
        }
    }

    public String testConnection() {
        try {
            initializeBucket();
            return "MinIO is working correctly. Bucket: " + bucketName;
        } catch (Exception e) {
            return "MinIO connection failed: " + e.getMessage();
        }
    }

    public String uploadTestFile() {
        try {
            initializeBucket();
            
            String testContent = "This is a test file for MinIO connection.";
            String objectName = "test/test-file.txt";
            
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(new java.io.ByteArrayInputStream(testContent.getBytes()), testContent.length(), -1)
                    .contentType("text/plain")
                    .build()
            );
            
            return "Test file uploaded successfully: " + objectName;
        } catch (Exception e) {
            return "Error uploading test file: " + e.getMessage();
        }
    }
}