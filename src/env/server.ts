import "server-only";

import { parseEnv, serverSchema } from "./schema";

/** Server-only variables. Importing this from a client component fails the build. */
export const serverEnv = parseEnv(serverSchema, process.env);
