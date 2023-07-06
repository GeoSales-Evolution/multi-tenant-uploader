FROM mongo

# Image will be generated with a Database already created and populated 
COPY init.js /docker-entrypoint-initdb.d/

# Make the script executable
RUN chmod +x /docker-entrypoint-initdb.d/init.js