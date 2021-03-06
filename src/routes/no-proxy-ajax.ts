function init(app: any, urlMap: any, commonAsync: any): void {
    urlMap.forEach((page: any) => {
        if (!page.async) {
            return
        }
        page.async.forEach((opt: any) => {
            try {
                opt.method = opt.method || 'post'
                opt.method.split(',').forEach(function(m: string): void {
                    app[m.toLowerCase()](opt.url, (req: any, res: any, next: any) => {
                        if (opt.handler) {
                            return res.json(opt.handler(req, res))
                        }
                        res.json(opt.result)
                    })
                })
            } catch (e) {
                throw new Error(`Error initializing page async data:${opt.url}`)
            }
        })
    })

    commonAsync.forEach((cfg: any) => {
        try {
            cfg.urls.forEach((url: string) => {
                app.use(url, (req: any, res: any) => {
                    res.json(cfg.data)
                })
            })
        } catch (e) {
            throw new Error(`Error initializing common async data.`)
        }
    })

    app.use((req: any, res: any) => {
        console.info(404)
        console.info(req.originalUrl)
        res.status(404).send('Page not found.')
    })
}
export default { init }
