import { Hono } from "hono";

// Correcting import paths
import { userRouter } from "./routes/user";
import { blogRouter } from "./routes/blog";

const app = new Hono();

app.route("/api/v1/user", userRouter);

app.route("/api/v1/blog", blogRouter);

export default app;
