# Usa la versión ligera de Node 20 LTS
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración de paquetes
COPY package*.json ./

# Copia el esquema de Prisma primero (necesario para generar el cliente)
COPY prisma ./prisma/

# Instala las dependencias
RUN npm install

# Genera el cliente de Prisma para poder conectarte a Supabase
RUN npx prisma generate

# Copia el resto del código fuente del backend
COPY . .

# Compila el código TypeScript de NestJS a JavaScript
RUN npm run build

# Expone el puerto 3000 (el que usa tu API)
EXPOSE 3000

# Inicia la aplicación en modo producción
CMD ["npm", "run", "start:prod"]