import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "~/server/db";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

export const authConfig = {
    providers: [
        GoogleProvider,
    ],
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
    },
    callbacks: {
        jwt: ({ token, user }) => {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        session: ({ session, token }) => ({
            ...session,
            user: {
                ...session.user,
                id: token.id as string,
            },
        }),
    },
} satisfies NextAuthConfig;