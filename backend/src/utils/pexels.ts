type PexelsPhoto = {
  src: { original: string; large2x: string; large: string; medium: string; small: string; portrait: string; landscape: string; tiny: string }
};

export async function findImageUrl(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;
  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('locale', 'ru-RU');
  const res = await fetch(url.toString(), { headers: { Authorization: apiKey } });
  if (!res.ok) return null;
  const data = await res.json();
  const photo: PexelsPhoto | undefined = data.photos?.[0];
  if (!photo) return null;
  return photo.src.landscape || photo.src.large2x || photo.src.large || photo.src.original || null;
}

