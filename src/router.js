class Router
{
    constructor()
    {
        this.regexRoutes = [];
        this.pathRoutes = new Map();
    }

    register(route, callback)
    {
        if(route instanceof RegExp)
        {
            this.regexRoutes.push({ regex: route, callback: callback });
        } else
        {
            this.pathRoutes.set(route, callback);
        }
    }

    route(path, req, html)
    {
        // path
        const pathCallback = this.pathRoutes.get(path);
        if(pathCallback)
        {
            html = pathCallback(req, html);
        }

        // regex
        for(const regexRoute of this.regexRoutes)
        {
            if(regexRoute.regex.test(path))
            {
                html = regexRoute.callback(req, html);
            }
        }
        return html;
    }
}

export default new Router();
