# M@S Studio

## AEM(Odin) Proxy

Due to different CORS limitations, proxy-server.mjs has been created in order to allow local development on the ports 3000 (aem) and 2023 (wtr dev server) without any CORS issues.

MAS Studio can be developped with the following markup using the proxy.

```html
<mas-studio base-url="http://localhost:8080"></mas-studio>
```

### running the proxy

```
npm run proxy
```

The proxy points to the Odin PROD bucket (`author-p22655-e59433`) and it can be changed in `package.json`.


