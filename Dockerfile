FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production --legacy-peer-deps || npm install --legacy-peer-deps
RUN npx prisma generate

COPY . .

# Passer les variables d'environnement au build
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG REDIS_HOST
ENV REDIS_HOST=$REDIS_HOST
# ... ajoute ici toutes les variables nécessaires

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]