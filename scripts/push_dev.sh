rm -rf dist-dev
npm run build
mv dist dist-dev
cd dist-dev
echo "dev.plannable.org" > CNAME
git init
git add .
git commit -m "Deploy to dev"
