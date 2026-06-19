import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/services/siteSettingsService";

export const SITE_SETTINGS_QUERY_KEY = ["site-settings"];

/**
 * Site branding settings (logo), used across header, footer, admin sidebar, and favicon.
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: getSiteSettings,
    staleTime: 5 * 60 * 1000,
  });
}
