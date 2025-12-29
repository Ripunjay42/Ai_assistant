import db from '../models/index.js';
import { uploadToS3, deleteFromS3 } from '../services/storage.service.js';
import { deleteVectorsByDocumentId } from '../services/vector-search.service.js';
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

    // Check for duplicate document (same filename in same workspace)
    const existingDoc = await db.Document.findOne({
      where: {
        name: file.originalname,
        workspaceId: workspaceId
      }
    });

    if (existingDoc) {
      return res.status(409).json({ 
        message: 'Document with this name already exists in workspace',
        existingDocument: {
          id: existingDoc.id,
          name: existingDoc.name,
          status: existingDoc.status
        }
      });
    }

    // Upload to S3
    const { url, key } = await uploadToS3(file, workspaceId);

    // Create document record
    const document = await db.Document.create({
      name: file.originalname,
      type: file.mimetype,
      workspaceId,
      uploadedBy: userId,
      status: 'UPLOADED',
      s3Key: key
    });

    // Push job to RabbitMQ
    const channel = getChannel();
    channel.sendToQueue(
      QUEUE,
      Buffer.from(
        JSON.stringify({
          documentId: document.id,
          workspaceId: workspaceId,
          bucket: process.env.AWS_S3_BUCKET,
          s3Key: key,
          fileUrl: url
        })
      ),
      { persistent: true }
    );

    return res.status(201).json({
      message: 'Document uploaded and queued',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        status: document.status,
        createdAt: document.createdAt
      }
    });
  } catch (err) {
    console.error('Upload failed:', err);
    return res.status(500).json({ message: 'Upload failed' });
  }
};

// Get all documents for a workspace
export const getDocuments = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const userId = req.user.userId;

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    // Check workspace access
    const member = await db.WorkspaceMember.findOne({
      where: { workspaceId, userId }
    });

    if (!member) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all documents for workspace
    const documents = await db.Document.findAll({
      where: { workspaceId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'type', 'status', 'createdAt']
    });

    return res.json({ documents });
  } catch (err) {
    console.error('Get documents failed:', err);
    return res.status(500).json({ message: 'Failed to fetch documents' });
  }
};

// Delete a document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const document = await db.Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check workspace access
    const member = await db.WorkspaceMember.findOne({
      where: { 
        workspaceId: document.workspaceId, 
        userId 
      }
    });

    if (!member) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete from S3 if s3Key exists
    if (document.s3Key) {
      try {
        await deleteFromS3(document.s3Key);
      } catch (err) {
        console.error('S3 deletion failed, continuing...', err.message);
      }
    }

    // Delete vectors from Qdrant
    await deleteVectorsByDocumentId(document.id);

    // Delete from database
    await document.destroy();

    return res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete document failed:', err);
    return res.status(500).json({ message: 'Failed to delete document' });
  }
};
