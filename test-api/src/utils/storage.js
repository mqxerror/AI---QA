const Minio = require('minio');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class StorageClient {
  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'minio',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    });

    this.bucketName = process.env.MINIO_BUCKET || 'testing-agent';
    this.publicUrl = process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;

    this.initBucket();
  }

  async initBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        logger.info(`Created MinIO bucket: ${this.bucketName}`);

        // Set bucket policy to public read
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`]
            }
          ]
        };
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        logger.info(`Set public read policy on bucket: ${this.bucketName}`);
      } else {
        logger.info(`MinIO bucket ${this.bucketName} already exists`);
      }
    } catch (error) {
      logger.error('Failed to initialize MinIO bucket:', error);
    }
  }

  /**
   * Upload a file to MinIO
   * @param {string} filePath - Local file path
   * @param {string} remotePath - Remote path in bucket (e.g., 'screenshots/test.png')
   * @param {string} contentType - MIME type
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  async uploadFile(filePath, remotePath, contentType = 'application/octet-stream') {
    try {
      const fileStream = fs.createReadStream(filePath);
      const fileStats = fs.statSync(filePath);

      await this.minioClient.putObject(
        this.bucketName,
        remotePath,
        fileStream,
        fileStats.size,
        { 'Content-Type': contentType }
      );

      const publicUrl = `${this.publicUrl}/${this.bucketName}/${remotePath}`;
      logger.info(`Uploaded file to MinIO: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      logger.error('Failed to upload file to MinIO:', error);
      throw error;
    }
  }

  /**
   * Upload buffer to MinIO
   * @param {Buffer} buffer - File buffer
   * @param {string} remotePath - Remote path in bucket
   * @param {string} contentType - MIME type
   * @returns {Promise<string>} - Public URL
   */
  async uploadBuffer(buffer, remotePath, contentType = 'application/octet-stream') {
    try {
      await this.minioClient.putObject(
        this.bucketName,
        remotePath,
        buffer,
        buffer.length,
        { 'Content-Type': contentType }
      );

      const publicUrl = `${this.publicUrl}/${this.bucketName}/${remotePath}`;
      logger.info(`Uploaded buffer to MinIO: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      logger.error('Failed to upload buffer to MinIO:', error);
      throw error;
    }
  }

  /**
   * Upload JSON data to MinIO
   * @param {Object} data - JSON data
   * @param {string} remotePath - Remote path in bucket
   * @returns {Promise<string>} - Public URL
   */
  async uploadJSON(data, remotePath) {
    const buffer = Buffer.from(JSON.stringify(data, null, 2));
    return this.uploadBuffer(buffer, remotePath, 'application/json');
  }

  /**
   * Delete a file from MinIO
   * @param {string} remotePath - Remote path in bucket
   */
  async deleteFile(remotePath) {
    try {
      await this.minioClient.removeObject(this.bucketName, remotePath);
      logger.info(`Deleted file from MinIO: ${remotePath}`);
    } catch (error) {
      logger.error('Failed to delete file from MinIO:', error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for temporary access
   * @param {string} remotePath - Remote path in bucket
   * @param {number} expirySeconds - URL expiry time in seconds (default: 7 days)
   * @returns {Promise<string>} - Presigned URL
   */
  async getPresignedUrl(remotePath, expirySeconds = 604800) {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        remotePath,
        expirySeconds
      );
      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL:', error);
      throw error;
    }
  }
}

// Singleton instance
const storageClient = new StorageClient();

module.exports = storageClient;
