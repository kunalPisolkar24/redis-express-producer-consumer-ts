import dotenv from "dotenv";

import { Redis } from "@upstash/redis";
import { BlogPost } from "./types";

dotenv.config();
console.log("Consumer: Initializing...");

const upstashUrl =
  process.env.UPSTASH_REDIS_REST_URL || "YOUR_UPSTASH_REDIS_REST_URL_HERE";
const upstashToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || "YOUR_UPSTASH_REDIS_REST_TOKEN_HERE";

if (
  upstashUrl === "YOUR_UPSTASH_REDIS_REST_URL_HERE" ||
  upstashToken === "YOUR_UPSTASH_REDIS_REST_TOKEN_HERE"
) {
  console.error(
    "Consumer: CRITICAL ERROR - Upstash Redis URL or Token is not configured. Please set them in the code or as environment variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)."
  );
  process.exit(1);
}

console.log(
  `Consumer: Attempting to configure Redis client for URL: ${upstashUrl.substring(
    0,
    upstashUrl.lastIndexOf("/") + 1
  )}... (Token is hidden for security)`
);

let redis: Redis;
try {
  redis = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });
  console.log("Consumer: Upstash Redis client configured.");
} catch (error: any) {
  console.error(
    "Consumer: Could not configure Upstash Redis client during initial setup.",
    error.message
  );
  process.exit(1);
}

const queueName = "blog_posts_queue_ts";
const pollingIntervalMs = 2000;

async function processQueue() {
  console.log(
    `Consumer: Now actively polling queue '${queueName}' every ${pollingIntervalMs}ms.`
  );
  while (true) {
    try {
      console.log(
        `Consumer: Attempting to LPOP message from queue '${queueName}'...`
      );
      const messageString = await redis.lpop<string>(queueName);

      if (messageString !== null) {
        if (typeof messageString === "string") {
          console.log(
            `Consumer: Message received from queue '${queueName}' at ${new Date().toISOString()}. Raw message: ${messageString}`
          );
          try {
            const messageData = JSON.parse(messageString) as BlogPost;
            console.log("Consumer: Successfully parsed message. Data:");
            console.log("  Post ID:", messageData.postId);
            console.log("  Text   :", messageData.text);
          } catch (parseError: any) {
            console.error(
              `Consumer: Failed to parse JSON from message. Error: ${parseError.message}. Raw message: '${messageString}'`
            );
          }
        } else {
          console.error(
            `Consumer: LPOP returned a non-string, non-null value. Type: ${typeof messageString}, Value:`,
            messageString
          );
        }
      } else {
        console.log(
          `Consumer: Queue '${queueName}' is currently empty. Will try again after ${pollingIntervalMs}ms.`
        );
      }
    } catch (error: any) {
      console.error(
        `Consumer: Error during LPOP or message processing. Error: ${error.message}`,
        error.stack
      );
      if (
        error.message.includes("ECONNRESET") ||
        error.message.includes("socket hang up") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("EAI_AGAIN")
      ) {
        console.warn(
          "Consumer: Network-related or DNS resolution error detected. Will retry polling after a short delay..."
        );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, pollingIntervalMs));
  }
}

async function main() {
  try {
    console.log(
      "Consumer: Verifying Redis connection by sending a PING command..."
    );
    const pingResult = await redis.ping();
    console.log(
      `Consumer: PING command successful, response: '${pingResult}'. Starting queue polling.`
    );
    await processQueue();
  } catch (err: any) {
    console.error(
      "Consumer: Failed to connect to Redis or critical error in main execution:",
      err.message
    );
    console.error(
      "Consumer: Ensure your Upstash URL and Token are correct and the database is reachable."
    );
    if (
      err.message &&
      (err.message.includes("ECONNRESET") ||
        err.message.includes("socket hang up") ||
        err.message.includes("ENOTFOUND") ||
        err.message.includes("EAI_AGAIN"))
    ) {
      console.error(
        "Consumer: This appears to be a network or DNS resolution issue. Check your internet connection and DNS settings."
      );
    }
    process.exit(1);
  }
}

main();
