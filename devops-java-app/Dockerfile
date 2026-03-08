# ============================================
# Multi-Stage Dockerfile for Java Application
# ============================================
# ===========================================
# Stage 1: Build Stage
# ===========================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

# Set working directory
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download dependencies (cached if pom.xml unchanged)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application (skip tests for faster build - tests run in CI)
RUN mvn clean package -DskipTests -B

# ===========================================
# Stage 2: Runtime Stage
# ===========================================
FROM eclipse-temurin:17-jre-alpine AS runtime

# Labels for container metadata
LABEL maintainer="DevOps Team <devops@company.com>"
LABEL version="1.0.0"
LABEL description="DevOps Java Application"

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create necessary directories
RUN mkdir -p /var/log/app && \
    chown -R appuser:appgroup /var/log/app

# Copy JAR from builder stage
COPY --from=builder /app/target/devops-java-app.jar app.jar

# Change ownership of application files
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# JVM tuning for container environments
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:InitialRAMPercentage=50.0 \
               -XX:+UseG1GC \
               -XX:+UseStringDeduplication \
               -Djava.security.egd=file:/dev/./urandom"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# Default Spring profile (can be overridden)
CMD ["--spring.profiles.active=default"]
