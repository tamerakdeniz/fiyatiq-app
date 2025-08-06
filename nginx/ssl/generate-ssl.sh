#!/bin/bash

# Generate self-signed SSL certificate for fiyatiq.wxcodesign.com
# Note: This is for testing only. Use real certificates in production.

echo "🔐 Generating self-signed SSL certificate..."

# Create private key
openssl genrsa -out nginx-selfsigned.key 2048

# Create certificate signing request
openssl req -new -key nginx-selfsigned.key -out nginx-selfsigned.csr -subj "/C=TR/ST=Istanbul/L=Istanbul/O=FiyatIQ/OU=Development/CN=fiyatiq.wxcodesign.com"

# Create self-signed certificate
openssl x509 -req -days 365 -in nginx-selfsigned.csr -signkey nginx-selfsigned.key -out nginx-selfsigned.crt

# Clean up CSR file
rm nginx-selfsigned.csr

echo "✅ SSL certificate generated successfully!"
echo "📁 Files created:"
echo "   - nginx-selfsigned.key (private key)"
echo "   - nginx-selfsigned.crt (certificate)"
echo ""
echo "⚠️  Note: This is a self-signed certificate for testing."
echo "   For production, use real SSL certificates from a trusted CA." 