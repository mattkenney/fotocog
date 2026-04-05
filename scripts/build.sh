#!/bin/bash
set -e

cd "$(dirname "$0")/.."

rm -rf build
mkdir build

# install production dependencies without redis
cp package.json build/
cp package-lock.json build/
cd build
npm ci --omit=dev
cd ..

# copy app files
cp lambda.js build/
cp app.js build/
cp -r controllers build/
cp -r lib build/
cp -r public build/
cp -r views build/

# create credentials.js stub (no aws keys needed on Lambda)
cat > build/credentials.js <<'EOF'
module.exports = {
    cookie: process.env.COOKIE_KEY,
    db: {
        backend: 'dynamodb',
        tableName: process.env.DYNAMODB_TABLE || 'fotocog'
    }
};
EOF

# zip
cd build
zip -qr ../fotocog.zip .
cd ..
rm -rf build

echo "Created fotocog.zip"
