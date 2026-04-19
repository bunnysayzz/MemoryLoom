FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY lib ./lib
COPY scripts ./scripts
COPY ui ./ui
COPY data ./data
COPY start.sh ./

ENV MEMORYLOOM_STORAGE_MODE=json
ENV MEMORYLOOM_DATA_DIR=/app/data
ENV MEMORYLOOM_LOG_LEVEL=info

RUN mkdir -p /app/data
RUN chmod +x start.sh

EXPOSE 8080 10000

CMD ["./start.sh"]
