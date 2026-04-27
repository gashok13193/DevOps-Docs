# Kafka Installation Guide (KRaft Mode)

This guide walks you through installing and validating Apache Kafka in KRaft mode on a Linux system.

## Phase 1: Prerequisites

Kafka runs on the Java Virtual Machine (JVM), so Java must be installed first.

### 1) Update your package manager

```bash
sudo apt update && sudo apt upgrade -y
```

### 2) Install Java (JDK 17 recommended)

```bash
sudo apt install openjdk-17-jdk -y
```

### 3) Verify Java installation

```bash
java -version
```

## Phase 2: Download and Extract Kafka

### 1) Download the Kafka binary

Move to `/opt` (a common location for third-party software) and download Kafka v4.2.0:

```bash
cd /opt
sudo wget https://downloads.apache.org/kafka/4.2.0/kafka_2.13-4.2.0.tgz
```

### 2) Extract the archive

```bash
sudo tar -xzf kafka_2.13-4.2.0.tgz
```

### 3) Rename the folder and set permissions

```bash
sudo mv kafka_2.13-4.2.0 kafka
cd /opt/kafka
```

## Phase 3: Configure and Initialize KRaft

With KRaft, Kafka manages metadata internally. Before starting the server, generate a unique cluster ID and format the storage directory.

### 1) Generate a new cluster ID

```bash
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"
```

### 2) Format the storage directory

This applies your cluster ID to the KRaft configuration.

```bash
bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c config/server.properties
```

## Phase 4: Start the Kafka Server

### 1) Start the Kafka broker as a daemon

```bash
bin/kafka-server-start.sh -daemon config/server.properties
```

### 2) Verify Kafka is running

Check active Java processes:

```bash
jps
```

You should see a `Kafka` process in the output.

## Phase 5: Test Your Installation

Create a topic, publish messages, and consume them to confirm everything works.

### 1) Create a test topic

```bash
bin/kafka-topics.sh --create --topic test-topic --partitions 1 --replication-factor 1 --bootstrap-server localhost:9092
```

### 2) Start a producer

Type messages and press Enter after each one. Press `Ctrl+C` to exit.

```bash
bin/kafka-console-producer.sh --topic test-topic --bootstrap-server localhost:9092
```

### 3) Start a consumer

Run this in a second terminal (or after stopping the producer) to read messages from the beginning:

```bash
bin/kafka-console-consumer.sh --topic test-topic --from-beginning --bootstrap-server localhost:9092
```
