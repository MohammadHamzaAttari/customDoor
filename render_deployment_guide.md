# Deployment Guide for Render (using Docker)

This guide will walk you through the process of publishing your Custom Door Designer application to Render using the Dockerfile we've created.

## Prerequisites

1.  A [Render](https://render.com/) account.
2.  Your code pushed to a GitHub or GitLab repository.
3.  A PostgreSQL database (you can create one on Render or use an existing one like Neon).

## Step-by-Step Instructions

### 1. Create a New Web Service on Render

1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click the **New +** button and select **Web Service**.
3.  Connect your GitHub/GitLab repository.
4.  Select the repository for this project.

### 2. Configure the Web Service

1.  **Name**: Give your service a name (e.g., `custom-door-designer`).
2.  **Runtime**: Select **Docker**.
3.  **Instance Type**: Choose a tier (the "Free" tier might work for small projects, but "Starter" is recommended for better performance).

### 3. Set Up Environment Variables

Render needs the environment variables defined in your `.env` file to run the app correctly.

1.  Go to the **Environment** tab of your new Web Service.
2.  Add the following variables:
    *   `DATABASE_URL`: Your PostgreSQL connection string.
    *   `SESSION_SECRET`: A long, random string for session security.
    *   `NODE_ENV`: Set this to `production`.
    *   Any other variables needed by your app (e.g., Shopify credentials if applicable).

> [!IMPORTANT]
> If you are using a Render PostgreSQL database, you can often link it directly to your Web Service, which will automatically provide the `DATABASE_URL`.

### 4. Deploy

1.  Click **Create Web Service** at the bottom of the page.
2.  Render will start building your Docker image. This might take a few minutes.
3.  Once the build is complete, Render will deploy the container.

### 5. Database Setup (Drizzle Push)

If you haven't already pushed your schema to the production database:

1.  You can run the migration command from your local machine, pointing to the production `DATABASE_URL`.
2.  Alternatively, you can add a `pre-deploy` command in Render, but for simplicity with Drizzle, running `npx drizzle-kit push` locally against the production DB is often easiest for initial setup.

## Verify the Deployment

1.  Once the status turns to **Live**, click the URL provided by Render (e.g., `https://custom-door-designer.onrender.com`).
2.  Verify that the 3D builder loads and functions as expected.

## Troubleshooting

-   **Build Failures**: Check the "Events" or "Logs" tab in Render to see why the Docker build failed.
-   **Port Issues**: The application is configured to listen on port `5000`. Render automatically detects the exposed port in the Dockerfile (`EXPOSE 5000`), but ensure no other overrides are conflicting.
-   **Database Connection**: Ensure your `DATABASE_URL` is correct and that the Render service can reach the database (check IP allowlists if using an external DB).
