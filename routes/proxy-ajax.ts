import configData from '../scanner/config'
import authTool from '../auth/cas'
const proxyCfg = configData.proxyConfig
import logUtil from '../util/log-util'

let urlRoot = `${proxyCfg.protocol}://${proxyCfg.useIP ? proxyCfg.ip : proxyCfg.domain}`

if (proxyCfg.enablePort) {
    urlRoot += `:${proxyCfg.port || ''}`
}

function init(app: any) {
    authTool.login()
        .then((superagent: any) => {
            app.use((req: any, res: any) => {
                const m = req.method.toLowerCase()
                const url = `${urlRoot}${req.path}`
                console.info(url)
                logUtil.logRequest(req)
                superagent[m](url)
                    .set({
                        'Content-Type': req.get('Content-Type'),
                        'User-Agent': req.get('User-Agent'),
                    })
                    .query(req.query)
                    .send(req.body)
                    .end((err: any, sres: any) => {
                        if (err) {
                            console.info('Error in sres')
                            logUtil.logAgentRes(sres)
                            res.status(500)
                                .json({
                                    retCode: 500,
                                    retDesc: 'proxy Error',
                                })
                        } else {
                            console.info('Response arrived.')
                            logUtil.logAgentRes(sres)
                            res.json(sres.body)
                        }
                    })
            })
        })
        .catch((err: any) => {
            console.info('Login CAS error.')
            console.info(err)
        })
}

export default {
    init,
}
