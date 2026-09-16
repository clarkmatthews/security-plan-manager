declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      organizationId?: string;
      role?: string;
      isPlatformAdmin?: boolean;
    };
  }

  interface User {
    id: string;
    organizationId?: string;
    role?: string;
    isPlatformAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    role?: string;
    isPlatformAdmin?: boolean;
  }
}
