FROM node:24-alpine
WORKDIR /app

# Installation des dépendances système
RUN apk add --no-cache libc6-compat

# Copie des fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances Node.js
RUN npm ci --only=production --legacy-peer-deps || npm install --legacy-peer-deps

# Génération du client Prisma
RUN npx prisma generate

# Copie du reste du code
COPY . .

# Build avec logs détaillés et sauvegarde
RUN npm run build --verbose 2>&1 | tee build.log || (echo "=== BUILD FAILED ===" && cat build.log && exit 1)

# Exposition du port
EXPOSE 3000

# Démarrage
CMD ["npm", "start"]