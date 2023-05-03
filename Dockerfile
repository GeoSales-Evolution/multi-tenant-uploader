FROM node:14

 COPY . .

 RUN yarn install

 EXPOSE 3000
 CMD ["yarn", "start"] 