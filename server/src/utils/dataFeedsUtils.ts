
export async function dataFeedsReq(
  route: string,
  queryParams?: Record<string, string | number | boolean>
) {
  const baseUrl = `${process.env.DATA_FEEDS_BASE_URL}${route}`;
  const urlParams = new URLSearchParams();

  urlParams.set("RSC_token", process.env.DATA_FEEDS_API_TOKEN!);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      urlParams.set(key, String(value));
    });
  }

  const url = `${baseUrl}?${urlParams.toString()}`;
  const res = await fetch(url);
  const data = await res.json();

  if (![200, 304].includes(res.status)) {
    throw new Error(`Data feeds request failed: ${res.status} ${data}`);
  }

  return data;
}
