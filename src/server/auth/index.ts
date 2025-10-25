import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

// Note: Type assertion needed due to next-auth v5 beta type compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig as any);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
