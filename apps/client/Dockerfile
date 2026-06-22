FROM node:24-alpine AS build

WORKDIR /app

COPY package.json yarn.lock* ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM nginx:alpine

ENV API_UPSTREAM=http://animus-api.default.svc.cluster.local:4000

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
