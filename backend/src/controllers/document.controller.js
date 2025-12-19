import db from '../models/index.js';
import { uploadToS3 } from '../services/storage.service.js';
import { getChannel, QUEUE } from '../config/rabbitmq.js';

export const uploadDocument = async (req, res) => {
  try {
    const { workspaceId } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check workspace access
    const member = await db.WorkspaceMember.findOne({
      where: { workspaceId, userId }
    });

    if (!member) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Upload to S3
    const { url, key } = await uploadToS3(file, workspaceId);

    // Create document record
    const document = await db.Document.create({
      name: file.originalname,
      type: file.mimetype,
      workspaceId,
      uploadedBy: userId,
      status: 'UPLOADED'
    });

    // Push job to RabbitMQ
    const channel = getChannel();
    channel.sendToQueue(
      QUEUE,
      Buffer.from(
        JSON.stringify({
          documentId: document.id,
          bucket: process.env.AWS_S3_BUCKET,
          s3Key: key,
          fileUrl: url
        })
      ),
      { persistent: true }
    );

    return res.status(201).json({
      message: 'Document uploaded and queued',
      document
    });
  } catch (err) {
    console.error('Upload failed:', err);
    return res.status(500).json({ message: 'Upload failed' });
  }
};
