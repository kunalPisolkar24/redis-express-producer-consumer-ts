# 🚀 Redis Express Producer-Consumer with TypeScript & Upstash 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Upstash](https://img.shields.io/badge/Upstash-1DA1F2?style=for-the-badge&logo=upstash&logoColor=white)](https://upstash.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A hands-on example demonstrating the **producer-consumer pattern** for asynchronous task processing. This project uses Node.js with TypeScript, an Express.js API as the producer, and a standalone consumer script. Messages are queued using Redis, specifically configured to connect to an **Upstash Redis instance**. The entire setup is containerized using Docker for easy development and deployment.

This project is designed to be a clear and practical guide with verbose logging to help you understand the flow of messages and the interaction between services.

## ✨ Features

*   **Producer Service:** An Express.js API endpoint (`/publish`) that pushes mock blog post data to a Redis list.
*   **Consumer Service:** A Node.js script that polls the Redis list, retrieves messages, and prints them.
*   **Redis Integration:** Utilizes Upstash Redis as the message broker.
*   **TypeScript:** Fully written in TypeScript for type safety and better developer experience.
*   **Dockerized:** `Dockerfile` and `docker-compose.yml` for easy multi-container setup.
*   **Verbose Logging:** Detailed logs from both producer and consumer to trace the process.
*   **Asynchronous Processing:** Demonstrates decoupling of tasks using a message queue.

## 🛠️ Tech Stack

*   **Backend:** Node.js
*   **Framework:** Express.js (for producer)
*   **Language:** TypeScript
*   **Database/Queue:** Redis (via [@upstash/redis](https://github.com/upstash/upstash-redis))
*   **Containerization:** Docker, Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js) or [yarn](https://yarnpkg.com/)
*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop, ensure you can run `docker compose`)
*   An active [Upstash Account](https://upstash.com/) with a Redis database created. You'll need your **Upstash Redis REST URL** and **Upstash Redis REST Token**.

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kunalPisolkar24/redis-express-producer-consumer-ts.git
    cd redis-express-producer-consumer-ts
    ```

2.  **Create a `.env` file:**
    This project uses a `.env` file to store your Upstash credentials. Create a file named `.env` in the root of the project.
    You can copy the example file (ensure you have an `.env.example` in your repo):
    ```bash
    cp .env.example .env
    ```
    If you don't have an `.env.example` yet, create one in the root with:
    ```env
    # Upstash Redis Credentials
    # Copy this file to .env and replace with your actual credentials.
    UPSTASH_REDIS_REST_URL="YOUR_UPSTASH_REDIS_REST_URL_HERE"
    UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_REDIS_REST_TOKEN_HERE"
    ```

3.  **Populate your `.env` file:**
    Open the `.env` file and add your Upstash Redis credentials:
    ```env
    UPSTASH_REDIS_REST_URL="your_actual_upstash_redis_rest_url"
    UPSTASH_REDIS_REST_TOKEN="your_actual_upstash_redis_rest_token"
    ```
    Replace the placeholder values with your actual credentials from the Upstash console.

4.  **Build and run the services using Docker Compose:**
    This command will build the Docker images (if they don't exist or if `Dockerfile` changed) and start the producer and consumer services in detached mode.
    ```bash
    docker compose up --build -d
    ```

## 🕹️ Usage

Once the services are up and running:

1.  **Trigger the Producer:**
    Open your terminal or a tool like Postman and send a GET request to the producer's `/publish` endpoint. If you're using the default port configuration (port 8000 for the producer):
    ```bash
    curl http://localhost:8000/publish
    ```
    Each time you hit this endpoint, a new blog post message will be pushed to the Redis queue.

2.  **Observe the Logs:**
    You can view the logs from each service to see the flow of messages:

    *   **Producer Logs:**
        ```bash
        docker compose logs -f producer
        ```
        You should see logs indicating a request was received and a message was published.

    *   **Consumer Logs:**
        ```bash
        docker compose logs -f consumer
        ```
        You should see logs indicating the consumer is polling the queue and, upon receiving a message, prints its content.

3.  **Stopping the Services:**
    To stop and remove the containers, networks, and volumes created by Docker Compose:
    ```bash
    docker compose down
    ```

## ⚙️ How It Works

1.  The **Producer** (`src/producer.ts`) is an Express.js application.
    *   It exposes a GET endpoint at `/publish`.
    *   When `/publish` is called, it takes a pre-defined blog post object, stringifies it, and pushes it to the right-end of a Redis list (queue) named `blog_posts_queue_ts` using the `RPUSH` command via the `@upstash/redis` client.

2.  The **Consumer** (`src/consumer.ts`) is a standalone Node.js script.
    *   It connects to the same Upstash Redis instance.
    *   It enters an infinite loop, polling the `blog_posts_queue_ts` Redis list.
    *   In each polling attempt, it tries to pop a message from the left-end of the list using the `LPOP` command.
    *   If a message is retrieved, it parses the JSON string back into an object and logs the blog post data to the console.
    *   If the queue is empty, it logs this and waits for a defined interval before polling again.


## 🐳 Dockerization Details

*   The `Dockerfile` uses a **multi-stage build**:
    1.  A `builder` stage installs all dependencies (including devDependencies) and compiles the TypeScript code to JavaScript (in `/app/dist`).
    2.  A final production stage copies only the compiled JavaScript from the `builder` stage and installs *only* production dependencies, resulting in a smaller and more secure image.
*   `docker-compose.yml` defines two services: `producer` and `consumer`.
    *   Both services are built using the same `Dockerfile`.
    *   The `command` for each service specifies which script (`dist/producer.js` or `dist/consumer.js`) to run.
    *   Environment variables for Upstash credentials are passed from the host (or a `.env` file) into the containers.
    *   The producer service maps port 8000 on the host to port 8000 in its container.

## 🤝 Contributing

Feel free to fork this repository, make improvements, and submit pull requests! If you find any issues or have suggestions, please open an issue.

---

Made with ❤️ by Kunal Pisolkar