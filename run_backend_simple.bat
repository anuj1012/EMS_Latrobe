@echo off
echo Starting Backend Server...
echo.

REM Set JAVA_HOME to JDK 21
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java Version:
java -version
echo.

echo Starting Spring Boot application...
echo Please open the project in your IDE and run LeaveApprovalApplication.java
echo.
echo Alternative: Use IntelliJ IDEA, Eclipse, or VS Code to run the backend
echo.
echo The backend needs to be running for the frontend to work properly.
echo.
pause










