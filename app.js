import koa from "koa"; // koa@2
import koaBody from "koa-bodyparser";
import { registerRoutes } from "./routes";

const app = new koa();
app.use(koaBody());
// Register routes
registerRoutes(app);
app.listen(3000);
