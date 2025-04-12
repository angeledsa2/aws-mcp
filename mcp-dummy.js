console.log(JSON.stringify({
  tools: [
    {
      name: "ping",
      description: "Responds with pong",
      parameters: {
        type: "object",
        properties: {},
        required: []
      },
      method: async function () {
        return { result: "pong" };
      }
    }
  ]
}));
process.stdin.resume();
