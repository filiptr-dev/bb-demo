// Catalog filter state is the URL: `update` patches search params (empty string removes a key).
export type UpdateParams = (patch: Record<string, string>) => void;

export type CatalogFilters = {
  type: string;
  bore: string;
  seal: string;
  dmin: string; dmax: string;
  Dmin: string; Dmax: string;
  Bmin: string; Bmax: string;
};
