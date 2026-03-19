FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production --legacy-peer-deps || npm install --legacy-peer-deps

# Générer Prisma client
RUN npx prisma generate

# Copier tout le reste du projet
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]