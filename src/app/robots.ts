import type { MetadataRoute } from "next";

/** Search engines may index the public record, but not the official desks or the photo routes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/", "/lang"] }],
  };
}
