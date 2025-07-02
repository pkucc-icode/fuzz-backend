# build
docker build . -t fuzz-web
# docker build  -f simple.dockerfile . -t fuzz-web

# run
# docker run --name fuzz-web -p 8080:8080 -d fuzz-web 