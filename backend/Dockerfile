# Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
# Copy the pom.xml
COPY pom.xml .
# Download dependencies
RUN mvn dependency:go-offline -B || true
# Copy the source code
COPY src ./src
# Build the application
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copy the built jar file
COPY --from=build /app/target/*.jar app.jar
# Expose the port (Render sets PORT env)
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
