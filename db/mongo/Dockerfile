FROM mongo

# Copy the initialization script to the container
COPY init.js /docker-entrypoint-initdb.d/

# Make the script executable
RUN chmod +x /docker-entrypoint-initdb.d/init.js