import fastify from "fastify";
export const startHttp = async () => {
  const server = fastify();

  // Declare a route
  server.get("/:id", async (request) => {
    return Number((request.params as any)["id"]) + 1;
  });

  // Run the server!
  await server.listen({ port: 3000 });
};
