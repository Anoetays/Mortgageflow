import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    const { applicationId, documentType } = req.body;
    const { id: userId } = req.user;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!applicationId || !documentType) {
      return res.status(400).json({ error: 'Application ID and document type required' });
    }

    // Validate file size (5MB max)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only PDF, JPG, and PNG files allowed' });
    }

    // Upload to Supabase Storage
    const fileName = `${applicationId}/${documentType}/${uuidv4()}-${req.file.originalname}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    // Record in database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          application_id: applicationId,
          document_type: documentType,
          file_name: req.file.originalname,
          file_path: uploadData.path,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          uploaded_by: userId,
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // Update application document status
    const docStatusMap = {
      'national-id': 'doc_id_received',
      'payslips': 'doc_payslips_received',
      'bank-statements': 'doc_bank_statements_received',
      'employment-letter': 'doc_employment_letter_received',
      'proof-residence': 'doc_proof_residence_received',
    };

    if (docStatusMap[documentType]) {
      await supabase
        .from('applications')
        .update({ [docStatusMap[documentType]]: true })
        .eq('id', applicationId);
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        fileName: document.file_name,
        type: document.document_type,
        uploadedAt: document.uploaded_at,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get document download URL
export const getDocumentUrl = async (req, res) => {
  try {
    const { filePath } = req.params;

    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      url: data.publicUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Get document record
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (deleteError) throw deleteError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get application documents
export const getApplicationDocuments = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      documents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
