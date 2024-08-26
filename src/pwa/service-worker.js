const CACHE_NAME = "image-cache-v1";
const TXT_CACHE_NAME = "txt-cache-v1";

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
    event.waitUntil(
        caches.open(TXT_CACHE_NAME)
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
    }
    else if(/(\/css\/)|(\/js\/)/.test(requestUrl.pathname))
    {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) =>
                {
                    return fetch(event.request).then((networkResponse) =>
                    {
                        const cacheCopy = networkResponse.clone();
                        if(networkResponse.ok)
                        {
                            caches.open(TXT_CACHE_NAME).then(cache =>
                            {
                                cache.put(event.request, cacheCopy);
                            });
                            console.log("network fallback: " + event.request.url);
                            return networkResponse;
                        }
                        else
                        {
                            console.log("cache fallback");
                            return cachedResponse;
                        }
                    });
                })
        );
    }
    else
    {
        event.respondWith(fetch(event.request));
    }
});