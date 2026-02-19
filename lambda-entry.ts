import serverlessExpress from '@vendia/serverless-express';

let serverlessExpressInstance: any;

async function setup() {
  // Dynamically import to handle cold starts properly
  const { app } = await import('./server/index');
  serverlessExpressInstance = serverlessExpress({ app });
}

export async function handler(event: any, context: any) {
  // Keep the connection alive between invocations
  context.callbackWaitsForEmptyEventLoop = false;
  
  if (!serverlessExpressInstance) {
    await setup();
  }
  
  return serverlessExpressInstance(event, context);
}
