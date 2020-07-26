import koaRouter from "@koa/router";
import pingRouter from "./ping";

const registerRoutes = (app) => {
  [pingRouter].forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());
  });
};

export { registerRoutes };
