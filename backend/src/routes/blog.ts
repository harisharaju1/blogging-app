import { Hono } from "hono";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import {
  createBlogInput,
  updateBlogInput,
} from "@harisharaju/blogging-app-common";
// the above imports would have been different if the
// backend app was hosted on a non-edge server

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

// Middleware to authenticate user for all blog routes
blogRouter.use("/*", async (c, next) => {
  // Extract the Authorization token from the request header
  const token = c.req.header("Authorization") || "";

  // Check if token is present
  if (!token) {
    c.status(401);
    return c.json({
      error: "User not authenticated",
    });
  }

  try {
    // Verify the JWT token
    const jwt = await verify(token, c.env.JWT_SECRET);

    // Double-check if JWT verification was successful
    if (!jwt) {
      c.status(401);
      return c.json({
        error: "User not authenticated",
      });
    }

    // Set the userId in the context for use in route handlers
    c.set("userId", String(jwt.id));

    // Continue to the next middleware or route handler
    await next();
  } catch (error) {
    // Handle any errors during token verification
    c.status(403);
    return c.json({
      message: "User not authenticated",
      errorMessage: (error as Error).message,
    });
  }
});

blogRouter.post("/", async (c) => {
  // to create a blog
  const body = await c.req.json();

  const success = createBlogInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      error: "inputs not correct",
    });
  }

  const userId = c.get("userId");

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: Number(userId),
    },
  });

  return c.json({
    id: post.id,
  });
});

blogRouter.put("/", async (c) => {
  // for a user to update an existing blog
  const body = await c.req.json();

  const success = updateBlogInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      error: "inputs not correct",
    });
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.post.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return c.json({
    post,
  });
});

blogRouter.get("/bulk", async (c) => {
  // for a user to get a list of blog posts with pagination
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: {
          id: "desc",
        },
      }),
      prisma.post.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return c.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    c.status(500);
    return c.json({
      message: "Error while fetching posts",
      error: (error as Error).message,
    });
  }
});

blogRouter.get("/:id", async (c) => {
  // for the user to get the contents of an individual blog post
  const id = c.req.param("id");

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: Number(id),
      },
    });
    return c.json({
      post,
    });
  } catch (error) {
    c.status(404);
    return c.json({
      message: "Error while getting a post",
    });
  }
});
