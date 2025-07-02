# build
docker build . -t fuzz-api
# docker build  -f simple.dockerfile . -t fuzz-api

# run
# docker run --name fuzz-api -p 8080:8080 -d fuzz-api 