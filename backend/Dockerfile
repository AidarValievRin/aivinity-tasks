FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
