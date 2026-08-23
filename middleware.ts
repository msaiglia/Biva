export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/pazienti/:path*", "/misurazione/:path*"],
};
