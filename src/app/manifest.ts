import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Relay",
    short_name: "Relay",
    description: "A clear video production workspace with local and cloud modes.",
    start_url: "/",
    display: "standalone",
    background_color: "#15130F",
    theme_color: "#15130F",
  };
}
