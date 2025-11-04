## Connect with Me

- **YouTube**: [Watch and Learn on YouTube](https://www.youtube.com/@AshokKumar-DevOps)  
- **LinkedIn**: [Connect with me on LinkedIn](https://www.linkedin.com/in/ashokkumar-devops13/)  
- **TopMate**: [Support or Consult on TopMate](https://topmate.io/ashok_kumar)  

## Support This Project

If you find this content helpful:
- **Like** the [YouTube video](https://www.youtube.com/@AshokKumar-DevOps) for more such tutorials.
- **Star** this GitHub repository to get the latest updates.




# Docker

## **1. Introduction to Docker and Its Components**

Docker is a platform designed to simplify and speed up application development and deployment using containers. Containers package an application with its dependencies and configurations, allowing it to run consistently across different environments.

### **Key Docker Components**

- **Docker Engine**: The runtime for building and running containers.
- **Docker Images**: Immutable, read-only templates used to create containers.
- **Docker Containers**: Running instances of images, isolated from the host system.
- **Docker Registry**: Storage for images, like Docker Hub (public registry).
- **Dockerfile**: A script of commands for creating Docker images.

Installation of Docker in Ubuntu:

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

To Install the latest Version:

 `sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`

 `sudo usermod -aG docker $USER
newgrp docker`

---

## **2. Basic Docker Commands**

### **Working with Images**

- **Pull an Image**:
    
    ```bash
    docker pull <image_name>
    
    ```
    
    - Example: `docker pull nginx` downloads the latest NGINX image.
- **List Images**:
    
    ```bash
    
    docker images
    
    ```
    
- **Remove an Image**:
    
    ```bash
    
    docker rmi <image_id>
    
    ```
    

### **Working with Containers**

- **Run a Container**:
    
    ```bash
    
    docker run -d --name <container_name> <image_name>
    
    ```
    
    - Example: `docker run -d --name my_nginx nginx` starts a detached NGINX container named `my_nginx`.
- **List Containers**:
    - Running containers: `docker ps`
    - All containers (including stopped): `docker ps -a`
- **Stop a Container**:
    
    ```bash
    
    docker stop <container_id>
    
    ```
    
- **Remove a Container**:
    
    ```bash
    
    docker rm <container_id>
    
    ```
    
- **Execute Commands in a Running Container**:
    
    ```bash
    
    docker exec -it <container_id> <command>
    
    ```
    
    - Example: `docker exec -it my_nginx bash` opens a Bash shell in the `my_nginx` container.

---

## **3. Docker Networking**

Docker networks allow containers to communicate with each other or the host machine.

### **Types of Docker Networks**

1. **Bridge Network (Default)**:
    - A private network on the host that containers can connect to by name.
    - Example:
        
        ```bash
        
        docker network create my_bridge_network
        docker run -d --network my_bridge_network --name web nginx
        docker run -d --network my_bridge_network --name db mysql
        
        ```
        
2. **Host Network**:
    - Removes network isolation and directly attaches container network to the host.
    - Example:
        
        ```bash
        
        docker run -d --network host nginx
        
        ```
        
    - **Use Case**: Ideal for applications that need full network access, but it’s less isolated.
3. **Overlay Network**:
    - Used in Docker Swarm for container communication across multiple hosts.
    - Example:
        
        ```bash
        
        docker network create -d overlay my_overlay_network
        
        ```
        
    - **Use Case**: Useful for multi-host container orchestration.
4. **None Network**:
    - Completely disables networking for the container.
    - Example:
        
        ```bash
        
        docker run -d --name nginx_none --network none nginx

        
        ```
        

### **Network Commands**

- **List Networks**:
    
    ```bash
    
    docker network ls
    
    ```
    
- **Inspect a Network**:
    
    ```bash
    
    docker network inspect <network_name>
    
    ```
    
- **Remove a Network**:
    
    ```bash
    
    docker network rm <network_name>
    
    ```
    

---

## **4. Docker Volumes for Data Persistence**

Docker volumes persist data beyond the container lifecycle, making them essential for databases and applications with stateful data.

### **Types of Volumes**

1. **Named Volumes**:
    - Stored in Docker’s managed location on the host.
    - Example:
        
        ```bash
        
        docker volume create my_volume
        docker run -d --name my_container -v my_volume:/data nginx
        
        ```
        
2. **Bind Mounts**:
    - Binds a specific directory on the host to the container.
    - Example:
        
        ```bash
        
        docker run -d --name my_container -v /root:/tmp nginx
        
        ```
        
3. **Anonymous Volumes**:
    - Unnamed volumes Docker manages, often used temporarily.
    - Example:
        
        ```bash
        
        docker run -d -v /container/path nginx
        
        ```
        

### **Volume Commands**

- **Create a Volume**:
    
    ```bash
    
    docker volume create <volume_name>
    
    ```
    
- **List Volumes**:
    
    ```bash
    
    docker volume ls
    
    ```
    
- **Inspect a Volume**:
    
    ```bash
    
    docker volume inspect <volume_name>
    
    ```
    
- **Remove a Volume**:
    
    ```bash
    
    docker volume rm <volume_name>
    
    ```
    

---

## **5. Building Docker Images with Dockerfile**

A Dockerfile is a script that defines the steps to build a Docker image.

### **Dockerfile Commands**

- **FROM**: Sets the base image.
- **RUN**: Executes a command and creates a new image layer.
- **COPY**: Copies files from the host into the container.
- **WORKDIR**: Sets the working directory.
- **EXPOSE**: Exposes a port.
- **CMD**: Sets the default command.
- **ENTRYPOINT**: Configures the container to run as an executable.

### **Example Dockerfile**

```

# Base image
FROM python:3.9

# Set the working directory
WORKDIR /app

# Copy files into the container
COPY . .

# Install dependencies
RUN pip install -r requirements.txt

# Expose port
EXPOSE 5000

# Default command
CMD ["python", "app.py"]

```

- **Build the Image**:
    
    ```bash
    
    docker build -t my_python_app:1.4 .
    
    ```
    
- **Run the Container**:
    
    ```bash
    
    docker run -p 5000:5000 my_python_app
    
    ```
    

- **Example 1**: Simple NGINX Server
    
    ```
    
    # Simple NGINX Dockerfile
    FROM nginx:latest
    COPY ./my_site /usr/share/nginx/html
    EXPOSE 80
    
    ```
    
    - Explanation: This Dockerfile uses the official NGINX image and copies a local folder, `my_site`, into the container’s web server directory.
- **Example 2**: Python Web App
    
    ```
    
    # Python Flask App Dockerfile
    FROM python:3.9
    WORKDIR /app
    COPY . /app
    RUN pip install -r requirements.txt
    EXPOSE 5000
    CMD ["python", "app.py"]
    
    ```
    
    - Explanation: Sets up a Python Flask web app by copying the code and installing dependencies from `requirements.txt`.
- **Example 3**: Java Application (Maven Build)
    
    ```
    
    # Maven Build Java Dockerfile
    FROM maven:3.8.5-openjdk-11 as build
    WORKDIR /home/kafka/kumar/Mavendemo/
    MAINTAINER Ashok
    COPY Mavendemo/pom.xml .
    COPY Mavendemo/src ./src
    ADD https://github.com/gashok13193/Mavendemo.git
    ENV test
    RUN mvn clean package
    
    *FROM openjdk:11*-jre-slim
    WORKDIR /app
    COPY --from=build /app/target/spring-boot-web.jar /app/spring-boot-web.jar
    EXPOSE 8080
    CMD ["java", "-jar", "spring-boot-web.jar"]
    ENTRYPOINT
    
    ```
    
    - Explanation: This Dockerfile uses a multi-stage build. It first compiles the code using Maven, then packages the final `.jar` file into a lightweight image.

### **CAUTION:**

### `Stop all running containers`

`docker stop $(docker ps -aq)`

### `Remove all containers`

`docker rm $(docker ps -aq)`

### `Remove all images`

`docker rmi $(docker images -q)`

## 🧩 Docker Compose File (YAML only)

This example runs two containers:

nginx (web server)

redis (database)

## 📄 docker-compose.yml

version: "3.9"

services:
  web:
    image: nginx:latest
    container_name: nginx-web
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    depends_on:
      - redis
    networks:
      - app-network

  redis:
    image: redis:alpine
    container_name: redis-server
    networks:
      - app-network

networks:
  app-network:
    driver: bridge


## 📘 What it does

Runs NGINX web server on port 8080

Uses Redis as a backend

Shares a custom network (app-network)

Mounts ./html folder from your host to /usr/share/nginx/html in the container
→ You can create an index.html inside ./html to show a custom page.

💻 Docker Compose Commands for Demo

### 🧱 1️⃣ Build and start all services

docker compose up -d


✅ Runs containers in background (-d = detached mode)

### 🧾 2️⃣ View running containers
docker compose ps

### 📜 3️⃣ View container logs (real-time)
docker compose logs -f

### 🔍 4️⃣ Check logs of a single service
docker compose logs web

### 🧠 5️⃣ Execute command inside container
docker compose exec web ls /usr/share/nginx/html

### 🧩 6️⃣ Stop containers (without removing)
docker compose stop

### 🧹 7️⃣ Remove containers, networks, volumes
docker compose down

### 🔄 8️⃣ Restart services
docker compose restart

### 🧰 9️⃣ Scale services (great demo)
docker compose up -d --scale web=3


This creates 3 NGINX containers (load-balanced via Docker network).
