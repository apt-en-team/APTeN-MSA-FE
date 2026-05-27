# 1단계: 빌드 (Node.js)
FROM node:22.12.0 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 실행 (Nginx)
FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Nginx 설정 파일 (History 모드 대응용)
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
# 120번 서버나 빌드 서버에서 파일을 복사하고
COPY wrapper.sh /wrapper.sh

# ★ 이 줄이 없으면 'Permission Denied'가 뜹니다! ★
RUN chmod +x /wrapper.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]