import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleRequest = createMiddleware(routing);

export default handleRequest;
export const proxy = handleRequest;

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
