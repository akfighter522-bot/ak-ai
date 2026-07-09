let app: any = null;
let loadError: any = null;

try {
  const serverModule = await import("../server");
  app = serverModule.default;
} catch (err: any) {
  loadError = {
    message: err.message,
    stack: err.stack,
    name: err.name
  };
}

export default async function handler(req: any, res: any) {
  if (loadError) {
    return res.status(500).json({
      error: "Server failed to initialize",
      message: loadError.message,
      stack: loadError.stack,
      name: loadError.name
    });
  }
  
  if (!app) {
    try {
      const serverModule = await import("../server");
      app = serverModule.default;
    } catch (err: any) {
      return res.status(500).json({
        error: "Server failed to lazy-load",
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    }
  }
  
  return app(req, res);
}

