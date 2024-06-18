const CACHE_NAME = "image-cache-v1";

self.addEventListener("install", event =>
{
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache =>
            {
                // Initial cache setup can be empty
                return cache.addAll([]);
            })
    );
});

self.addEventListener("fetch", event =>
{
    const requestUrl = new URL(event.request.url);

    // Check if the request URL"s pathname starts with /img/
    if(requestUrl.pathname.startsWith("/maimai-mobile/img/"))
    {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse =>
                {
                    if(cachedResponse)
                    {
                        return cachedResponse;
                    }
                    return fetch(event.request).then(networkResponse =>
                    {
                        return caches.open(CACHE_NAME).then(cache =>
                        {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    });
                })
        );
    } else
    {
        event.respondWith(fetch(event.request));
    }
});