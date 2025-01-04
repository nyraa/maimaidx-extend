class Router
{
    constructor()
    {
        this.regexRoutes = [];
        this.pathRoutes = new Map();
    }

    register(route, callback, routesEvenError = false)
    {
        if(route instanceof RegExp)
        {
            this.regexRoutes.push({ regex: route, callback: callback, routesEvenError: routesEvenError });
        } else
        {
            this.pathRoutes.set(route, { callback: callback, routesEvenError: routesEvenError });
        }
    }

    route(path, req, html, isError)
    {
        // path
        const routeRegister = this.pathRoutes.get(path);
        if(routeRegister && (!isError || routeRegister.routesEvenError))
        {
            html = routeRegister.callback(req, html);
        }

        // regex
        for(const regexRoute of this.regexRoutes)
        {
            if((!isError || regexRoute.routesEvenError) && regexRoute.regex.test(path))
            {
                html = regexRoute.callback(req, html);
            }
        }
        return html;
    }
}

export default new Router();
