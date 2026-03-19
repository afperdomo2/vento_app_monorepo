# Event Service
FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /app
COPY . .
RUN ./gradlew :microservices:event-service:bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=builder /app/microservices/event-service/build/libs/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
