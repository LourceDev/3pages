# 3pages

## Server setup

### .env.development

#### Generate JWT_SECRET:
<!-- https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs#step-1-generating-a-token -->
```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```

#### Example .env.development file:
```
DATABASE_URL="postgresql://myuser:mypassword@127.0.0.1:5432/mydb?schema=public"
JWT_SECRET=
NODE_ENV=development
PORT=3000
```

### Start database

```sh
npm run docker:db
```

### Run migrations

```sh
npm run dev:prisma migrate deploy
```

### Start dev server

```sh
npm run dev
```

## Client setup

### Start client

```sh
npm run dev
```

