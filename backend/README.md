# backend app using Hono

## tech used

### - Hono

### - Cloudflare Workers

### - Aiven.tech

### - Prisma Accelerate

#### This is the first step in creating the backend for a blogging app which is going to be hosted in Cloudflare Workers environment

#### This is why Hono is used which is the HTTP layer, or routing library; Hono works on serverless execution environments like Cloudflare Workers and Express does not

#### Aiven.tech is a cloud technology company that allows you to create databases, messaging systems, search engines, monitoring and visualization tools, and time-series databases

#### Prisma Accelerate -> Prisma Accelerate is a powerful tool designed to enhance database query performance by utilizing global caching and connection pooling mechanisms

##### since we’re planning to launch our backend using Cloudflare Workers, and what they do is create a bunch of serverless functions to launch multiple instances of your backend in various places of the world so that they can serve the HTTP requests of users much faster, we cannot use a DB, we need a connection pool

![connection_pool](https://github.com/harisharaju1/blogging-app/assets/22733255/a5f68f00-4488-4667-83d8-cf10502980fd)

#### We are planning to create the backend using a model-first approach and Prisma as the ORM

#### Backend app will pick up this Connection Pool URL that points to the DB, from the *wrangler.toml* file

**wrangler.toml** → is a configuration file for a Cloudflare Workers project. This file is used by Wrangler, which is Cloudflare's CLI tool for managing and deploying Workers projects.

#### The Prisma migrations pick up the DB URL from the .env file, this file was created by the npx prisma init command
