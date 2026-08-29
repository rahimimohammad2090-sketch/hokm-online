FROM node:22-alpine
WORKDIR /app
COPY package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
USER node
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node","production_server.js"]
