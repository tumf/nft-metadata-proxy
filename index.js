addEventListener("fetch", event => {
  event.respondWith(
    handleRequest(event.request).catch(
      err => new Response(err.stack, { status: 500 }),
    ),
  );
});

function MethodNotAllowed(request) {
  return new Response(`Method ${request.method} not allowed.`, {
    status: 405,
    headers: {
      Allow: "GET",
    },
  });
}

async function handleRequest(request) {
  let origin = request.headers.get("Origin");
  if (origin != null && !origin.match(RE_ORIGINS)) {
    origin = "*";
  }

  if (request.method == "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET",
      },
    });
  }

  if (request.method !== "GET") return MethodNotAllowed(request);

  const params = new URL(request.url).searchParams;
  const url = params.get("url");
  console.log(url);
  if (!url) {
    return new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }
  try {
    const resp = await fetch(url, {
      cf: {
        cacheTtl: CACHE_TTL,
        cacheEverything: true,
        cacheKey: url,
      },
    });
    const json = await resp.text();

    return new Response(json, {
      headers: {
        Vary: "Origin",
        "Cache-Control": `max-age=${CACHE_TTL}`,
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }
}
