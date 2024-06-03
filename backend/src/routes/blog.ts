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

blogRouter.use("/*", async (c, next) => {
  // extract user Id from JWT
  // make it available to the route handlers
  const token = c.req.header("Authorization") || "";
  if (!token) {
    c.status(401);
    return c.json({
      error: "User not authenticated",
    });
  }

  try {
    const jwt = await verify(token, c.env.JWT_SECRET);
    if (!jwt) {
      c.status(401);
      return c.json({
        error: "User not authenticated",
      });
    }

    c.set("userId", String(jwt.id));
    await next();
  } catch (error) {
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
      authorId: userId,
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
  // for a user to get a list of blog posts
  // pagination to be added here
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const posts = await prisma.post.findMany();
    console.log("posts:", posts);
    return c.json(posts);
  } catch (error) {
    c.status(404);
    return c.json({
      message: "Error while getting all post",
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
        id: id,
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
