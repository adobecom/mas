import http from 'http';
import { URL } from 'url';
import { main } from './index.js';

const PORT = 3000;

http.createServer(async (req, res) => {
    const { searchParams } = new URL(req.url, `http://localhost:${PORT}`);
    const params = Object.fromEntries(searchParams.entries());
    const result = await main(params);
    res.writeHead(result.statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body, null, 2));
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
