FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create auth directory if it doesn't exist
RUN mkdir -p auth

# Expose port
EXPOSE 8080

# Start the application
CMD ["python", "app.py"] 