FROM mysql:5.5

# ARG uid=1001
# ARG gid=1001

# # ensure user exists
# RUN addgroup --gid $gid --system mysql \
#     && adduser --uid $uid --disabled-password --system --gid $gid mysql

ADD ./src/db/docker/*.sql /docker-entrypoint-initdb.d

