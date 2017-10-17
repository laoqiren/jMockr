'use strict'

const path = require('path')
import config from '../scanner/config'
import scanner from '../scanner/index'
import uploadImg from './upload-img'
import uploadFile from './upload-file'
import noProxyAjax from './no-proxy-ajax'
const proxyAjax = require('./proxy-ajax')
const proxyConfig = scanner.proxyConfig
const injector = require('connect-inject')

function getRender(type = 'freemarker') {
    switch (type) {
        case 'freemarker':
            return require('@ybq/jmockr-ftl-render')({
                templateRoot: config.templateRoot,
                moduleFtlPathes: config.moduleFtlPathes,
            })
        case 'thymeleaf':
            const { TemplateEngine, StandardDialect } = require('thymeleaf')
            const engine = new TemplateEngine({
                dialects: [new StandardDialect('th')],
            })
            return (template: string, syncData: {}, cb: (param: string) => void) => {
                const absolutePath = path.resolve(config.templateRoot, template)
                engine.processFile(absolutePath, syncData)
                    .then((result: string) => {
                        cb(result)
                    })
                    .catch((e: any) => {
                        console.error('render error', e)
                        cb(e)
                    })
            }
        default:
            console.error('Invalid template type:', type)
            throw new Error(`Invalid template type:${type}`)
    }
}
function initRequestMap(app: any, cb: () => void) {
    const render = getRender(config.templateType || 'freemarker')
    const { commonAsyncMock, mockData } = scanner.scan()

    initCORS(app)
    initWebSocket(app)

    // 初始化页面入口路由
    mockData.forEach((page: any) => {
        try {
            app.get(page.entry, (req: any, res: any, next: any) => {
                if (req.xhr) {
                    next()
                } else {
                    page.syncData.RequestParameters = req.query || {}
                    render(page.template, page.syncData, (html: string) => {
                        res.send(html)
                    })
                }
            })
        } catch (e) {
            throw new Error(`Error initializing page entry:${page.entry}`)
        }
    })

    // Init upload image
    uploadImg(app)
    // Init upload file
    uploadFile(app)

    if (proxyConfig.enable) { // 初始化异步接口(返回本地配置的mock数据)
        proxyAjax.init(app)
    } else { // 初始化异步接口(代理到远程测试服务器)
        noProxyAjax.init(app, mockData, commonAsyncMock)
    }
    return cb()
}

function initCORS(app: any) {
    app.all('*', (req: any, res: any, next: any) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With')
        res.header('Access-Control-Allow-Methods', 'POST, GET')
        next()
    })
}

function initWebSocket(app: any) {
    app.get('/socket.io.js', (req: any, res: any, next: any) => {
        res.sendFile(path.resolve(__dirname, '../script/socket.io.js'))
    })
    app.use(injector({
        snippet: `
        <script src="/socket.io.js"></script>
        <script>
            var socket = io()
            socket.on('reload', function(msg) {
                location.reload()
            })
        </script>
        `,
    }))
}

export default initRequestMap
