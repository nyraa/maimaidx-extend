function registerDaemon(interval_min, timeout_min, callback)
{
    setTimeout(() => {
        setInterval(callback, interval_min * 1000 * 60);
    }, timeout_min * 1000 * 60);
}

export default registerDaemon;