import express, { Request, Response } from "express";
import { Redis } from "@upstash/redis";
import { BlogPost } from "./types";
import dotenv from "dotenv";

dotenv.config();
console.log("Producer: Initializing...");
const app = express();
const port = 8000;

const upstashUrl =
  process.env.UPSTASH_REDIS_REST_URL || "YOUR_UPSTASH_REDIS_REST_URL_HERE";
const upstashToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || "YOUR_UPSTASH_REDIS_REST_TOKEN_HERE";

if (
  upstashUrl === "YOUR_UPSTASH_REDIS_REST_URL_HERE" ||
  upstashToken === "YOUR_UPSTASH_REDIS_REST_TOKEN_HERE"
) {
  console.error(
    "Producer: CRITICAL ERROR - Upstash Redis URL or Token is not configured. Please set them in the code or as environment variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)."
  );
  process.exit(1);
}

console.log(
  `Producer: Attempting to configure Redis client for URL: ${upstashUrl.substring(
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
  console.log("Producer: Upstash Redis client configured.");
} catch (error: any) {
  console.error(
    "Producer: Could not configure Upstash Redis client during initial setup.",
    error.message
  );
  process.exit(1);
}

const blogs: BlogPost[] = [
  { postId: 1, text: "First blog (TS): Introduction to @upstash/redis." },
  { postId: 2, text: "Second blog (TS): TypeScript with Express and Redis." },
  { postId: 3, text: "Third blog (TS): Understanding Serverless Redis." },
  {
    postId: 4,
    text: "Fourth blog (TS): Advanced queue patterns with Upstash.",
  },
  { postId: 5, text: "Fifth blog (TS): Deploying Node.js TS apps." },
];

let currentPostIndex = 0;
const queueName = "blog_posts_queue_ts";

app.get("/publish", async (req: Request, res: Response) => {
  console.log(
    `Producer: Received request at /publish endpoint at ${new Date().toISOString()}`
  );

  const blogPost = blogs[currentPostIndex];
  currentPostIndex = (currentPostIndex + 1) % blogs.length;

  try {
    const message = JSON.stringify(blogPost);
    console.log(
      `Producer: Preparing to publish message to queue '${queueName}'. Message content: ${message}`
    );

    const pushResult = await redis.rpush(queueName, message);
    console.log(
      `Producer: Message for postId ${
        blogPost.postId
      } pushed to queue '${queueName}'. RPUSH command result: ${JSON.stringify(
        pushResult
      )} (length of the list after push)`
    );

    res.status(200).send({
      success: true,
      message: "Blog post published successfully!",
      postId: blogPost.postId,
      text: blogPost.text,
    });
    console.log(
      `Producer: Successfully published postId ${blogPost.postId} and sent response.`
    );
  } catch (error: any) {
    console.error(
      `Producer: Error publishing message to Redis for postId ${blogPost.postId}. Error: ${error.message}`,
      error.stack
    );
    res.status(500).send({
      success: false,
      message: "Error publishing message to Redis.",
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(
    `Producer: Express server (TypeScript) started and listening on http://localhost:${port}`
  );
  console.log(
    `Producer: Send a GET request to http://localhost:${port}/publish to push a blog post to the Redis queue '${queueName}'.`
  );
});
