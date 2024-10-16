import { Hono } from "hono";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
// the above imports would have been different if the
// backend app was hosted on a non-edge server

import { signupInput, signinInput } from "@harisharaju/blogging-app-common";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signin", async (c) => {
  // for user to signin
  const body = await c.req.json();

  const success = signinInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      error: "inputs not correct",
    });
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: body.username,
      },
    });

    if (!user) {
      c.status(403);
      return c.json({ message: "User not found" });
    }

    // Assuming password is hashed and a method to verify the hash is available
    // This should be replaced with a proper hash comparison
    const isPasswordValid = body.password === user.password;

    if (!isPasswordValid) {
      c.status(401);
      return c.json({ message: "Invalid credentials" });
    }

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);

    c.res.headers.set("authorization", `Bearer ${jwt}`);

    return c.json({ message: "Authentication successful" });
  } catch (error) {
    c.status(500);
    return c.json({ message: (error as Error).message });
  }
});

userRouter.post("/signup", async (c) => {
  // Initialize Prisma client with Accelerate extension
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  // Parse the request body
  const body = await c.req.json();

  // Validate input using Zod schema
  const success = signupInput.safeParse(body);
  if (!success) {
    // If validation fails, return a 411 status code
    c.status(411);
    return c.json({
      error: "Invalid input data",
    });
  }

  try {
    // Create a new user in the database
    const user = await prisma.user.create({
      data: {
        username: body.email,
        password: body.password, // Note: Password should be hashed before storing
      },
    });

    // Generate a JWT token for the new user
    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);

    // Set the JWT token in the response header
    c.res.headers.set("authorization", `Bearer ${jwt}`);

    // Return a success message
    return c.json({ message: "Registration successful" });
  } catch (error) {
    // Handle any errors during user creation
    c.status(401);
    return c.json({ message: (error as Error).message });
  }
});
