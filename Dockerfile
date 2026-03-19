FROM node:24-alpine
WORKDIR /app

# Installation des dépendances système
RUN apk add --no-cache libc6-compat

# Copie des fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances Node.js
RUN npm ci --only=production --legacy-peer-deps || \
    npm install --legacy-peer-deps

# Génération du client Prisma
RUN npx prisma generate

# Copie du reste du code
COPY . .

# Build de l'application
RUN npm run build

# Exposition du port
EXPOSE 3000

# Démarrage
CMD ["npm", "start"]