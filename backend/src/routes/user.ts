import { Hono } from "hono";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
// the above imports would have been different if the
// backend app was hosted on a non-edge server

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signin", async (c) => {
  // for user to signin
  const body = await c.req.json();

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
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
  // prisma route config
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  //add Zod validation here

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);

    c.res.headers.set("authorization", `Bearer ${jwt}`);

    return c.json({ message: "Registration successful" });
  } catch (error) {
    c.status(401);
    return c.json({ message: (error as Error).message });
  }
});
