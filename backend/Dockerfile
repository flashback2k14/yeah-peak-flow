FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --workspace backend --include-workspace-root=false

COPY backend ./backend

RUN npm run build --workspace backend

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:push --workspace backend && npm run start --workspace backend"]
