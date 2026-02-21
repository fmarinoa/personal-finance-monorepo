export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (...args: any[]) => any;

export interface RouteOptions {
  timeout?: number;
  memorySize?: number;
  description?: string;
}

export interface RouteDefinition<H = AnyHandler> extends RouteOptions {
  id: string;
  method: HttpMethod;
  path: string;
  handler: H;
}

export type HandlerAdapter<H> = (method: HttpMethod, path: string, fn: H) => H;

function toRouteId(method: HttpMethod, path: string): string {
  const normalized = path.replace(/^\//, "");
  const parts = normalized
    .split("/")
    .map((p) => p.replace(/^\{(\w+)\}$/, "By$1"));
  const pascal = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return method.toLowerCase() + pascal;
}

export class Dispatcher<H = AnyHandler> {
  private readonly _routes: RouteDefinition<H>[] = [];

  constructor(private readonly adapt?: HandlerAdapter<H>) {}

  private register(
    method: HttpMethod,
    path: string,
    fn: H,
    opts?: RouteOptions,
  ): this {
    const handler = this.adapt ? this.adapt(method, path, fn) : fn;
    this._routes.push({
      id: toRouteId(method, path),
      method,
      path,
      handler,
      ...opts,
    });
    return this;
  }

  get(path: string, fn: H, opts?: RouteOptions): this {
    return this.register("GET", path, fn, opts);
  }

  post(path: string, fn: H, opts?: RouteOptions): this {
    return this.register("POST", path, fn, opts);
  }

  put(path: string, fn: H, opts?: RouteOptions): this {
    return this.register("PUT", path, fn, opts);
  }

  patch(path: string, fn: H, opts?: RouteOptions): this {
    return this.register("PATCH", path, fn, opts);
  }

  delete(path: string, fn: H, opts?: RouteOptions): this {
    return this.register("DELETE", path, fn, opts);
  }

  get routes(): ReadonlyArray<RouteDefinition<H>> {
    return this._routes;
  }

  /**
   * Get handler for Lambda execution based on ROUTE_ID env var
   * Used by CDK to create individual Lambda functions
   */
  getHandler(): H {
    const routeId = process.env.ROUTE_ID;
    if (!routeId) {
      throw new Error("ROUTE_ID environment variable is not set");
    }

    const route = this._routes.find((r) => r.id === routeId);
    if (!route) {
      throw new Error(`No route found with id: ${routeId}`);
    }

    return route.handler;
  }
}
