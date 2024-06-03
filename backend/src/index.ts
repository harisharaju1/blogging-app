import { Hono } from "hono";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
// the above imports would have been different if the
// blackend app was hosted on a non-edge server

// const prisma = new PrismaClient({
//   datasourceUrl: c.DATABASE_URL,
// }).$extends(withAccelerate());

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();
// const app = express();

app.post("api/v1/blog", (c) => {
  // to create a blog

  // prisma route config
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  return c.text("Hello Hono!");
});

app.post("api/v1/user/signin", (c) => {
  // for user to signin
  return c.text("Hello Hono!");
});

app.post("api/v1/user/signup", (c) => {
  // for user to signup
  return c.text("Hello Hono!");
});

app.put("api/v1/blog", (c) => {
  // for a user to update an existing blog
  return c.text("Hello Hono!");
});

app.get("api/v1/blog/:id", (c) => {
  // for the user to get the contents of an individual blog post
  return c.text("Hello Hono!");
});

app.get("api/v1/blog/bulk", (c) => {
  // for a user to get a list of blog posts
  return c.text("Hello Hono!");
});

export default app;
