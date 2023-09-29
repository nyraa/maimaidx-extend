function registerDaemon(interval, timeout, callback)
{
    setTimeout(() => {
        setInterval(callback, interval);
    }, timeout);
}

export default registerDaemon;