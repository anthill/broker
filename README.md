# TCP sensors uptime monitoring

### Here are the steps you need to do in order to run all the services in local

- Clone the repository
- run npm install
- change to local paths in `client/connectInfo.js` and `express/index.html`
- run the tcp server : `node app/tcp/server.js`
- run the web server : `node app/express/server.js`
- run the client : `node app/client/client.js`
- open your browser and go to [http://localhost:7000](http://localhost:7000)

### Using docker compose

- Clone the repository
- change to local paths in `client/connectInfo.js` and `express/index.html`
- run `docker-compose up`
- run npm install
- run the client : `node app/client/client.js`
- open your browser and go to [http://localhost:7000](http://localhost:7000) (or the boot2docker ip for mac users)