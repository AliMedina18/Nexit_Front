import { GEO } from "./geo";
import type { Provider } from "@/types/domain";

/** All countries known either from GEO or already used by existing providers. */
export function allCountries(providers: Provider[]): string[] {
  const set = new Set<string>([...Object.keys(GEO), ...providers.map((p) => p.pais).filter(Boolean)]);
  return [...set].sort();
}

/** Regions for a país, combining the static GEO table with any custom region already saved on a provider. */
export function regionsForCountry(pais: string, providers: Provider[]): string[] {
  const geoData = GEO[pais];
  if (geoData) {
    const customRegions = providers
      .filter((p) => p.pais === pais)
      .map((p) => p.region)
      .filter((r): r is string => Boolean(r) && !geoData.regions[r]);
    return [...Object.keys(geoData.regions), ...new Set(customRegions)];
  }
  const customRegions = providers
    .filter((p) => p.pais === pais)
    .map((p) => p.region)
    .filter((r): r is string => Boolean(r));
  return [...new Set(customRegions)].sort();
}

/** Cities for a país + región, combining GEO with any custom city already saved on a provider. */
export function citiesForRegion(pais: string, region: string, providers: Provider[]): string[] {
  const geoData = GEO[pais];
  const staticCities = geoData?.regions[region] ?? [];
  const customCities = providers
    .filter((p) => p.pais === pais && p.region === region)
    .map((p) => p.ciudad)
    .filter((c): c is string => Boolean(c));
  return [...new Set([...staticCities, ...customCities])].sort();
}

export function regionLabel(pais: string): string {
  return GEO[pais]?.label ?? "Departamento / Estado";
}
