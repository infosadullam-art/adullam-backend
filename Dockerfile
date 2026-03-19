FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production --legacy-peer-deps || npm install --legacy-peer-deps
RUN npx prisma generate

COPY . .

# ✅ AJOUTE TOUTES LES VARIABLES REDIS
ARG REDIS_HOST
ENV REDIS_HOST=$REDIS_HOST
ARG REDIS_PORT
ENV REDIS_PORT=$REDIS_PORT
ARG REDIS_PASSWORD
ENV REDIS_PASSWORD=$REDIS_PASSWORD
ARG REDIS_SSL
ENV REDIS_SSL=$REDIS_SSL
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]