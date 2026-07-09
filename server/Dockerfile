FROM node:22-alpine

WORKDIR /app

COPY package.json ./package.json
COPY server/package.json ./server/package.json

RUN npm install --workspace server

COPY server ./server

EXPOSE 4000

CMD ["npm", "run", "dev", "--workspace", "server"]