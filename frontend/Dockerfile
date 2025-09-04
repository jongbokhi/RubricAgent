# Nginx를 사용한 프론트엔드 서빙
FROM nginx:alpine

# 작업 디렉토리 설정
WORKDIR /usr/share/nginx/html

# 기존 nginx 기본 파일들 제거
RUN rm -rf /usr/share/nginx/html/*

# 프론트엔드 파일들을 nginx html 디렉토리로 복사
COPY index.html .
COPY styles.css .
COPY script.js .

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 80 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
