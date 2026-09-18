import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PARENT" | "STUDENT";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "PARENT" | "STUDENT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PARENT" | "STUDENT";
  }
}
