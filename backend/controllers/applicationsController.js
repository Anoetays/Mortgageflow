import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';

// Generate unique Application ID
const generateAppId = () => 'MF-' + Math.floor(100000 + Math.random() * 900000);

// Submit new application
export const submitApplication = async (req, res) => {
  try {
    const {
      fname, lname, phone, email, nationalId, dob, address, maritalStatus, dependants,
      empStatus, employer, income, expenses, loans, yearsEmployed,
      propAddr, propType, price, deposit, term, willingSeller,
      docs
    } = req.body;

    // Validation
    if (!fname || !lname || !phone || !email || !price || !deposit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const appId = generateAppId();
    const loanAmount = parseInt(price) - parseInt(deposit);

    const { data, error } = await supabase
      .from('applications')
      .insert([
        {
          id: appId,
          applicant_name: `${fname} ${lname}`,
          phone,
          email,
          national_id: nationalId,
          date_of_birth: dob,
          address,
          marital_status: maritalStatus,
          dependants: parseInt(dependants) || 0,
          employment_status: empStatus,
          employer,
          gross_monthly_income: parseFloat(income),
          monthly_expenses: parseFloat(expenses),
          existing_loans: parseFloat(loans),
          years_employed: parseInt(yearsEmployed),
          property_address: propAddr,
          property_type: propType,
          purchase_price: parseFloat(price),
          deposit_amount: parseFloat(deposit),
          loan_amount: loanAmount,
          loan_term: parseInt(term),
          willing_seller: willingSeller,
          stage: 'intake',
          doc_id_received: docs?.id || false,
          doc_payslips_received: docs?.payslips || false,
          doc_bank_statements_received: docs?.bankStatements || false,
          doc_employment_letter_received: docs?.empLetter || false,
          doc_proof_residence_received: docs?.proofRes || false,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Create initial history entry
    await supabase
      .from('application_history')
      .insert([
        {
          application_id: appId,
          stage: 'intake',
          message: 'Application received and entered into system.'
        }
      ]);

    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: appId,
      application: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get application by ID
export const getApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Get history
    const { data: history } = await supabase
      .from('application_history')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: true });

    // Get documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', id);

    res.json({
      success: true,
      application: {
        ...application,
        history: history || [],
        documents: documents || [],
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all applications (officer dashboard)
export const getApplications = async (req, res) => {
  try {
    const { stage, declined, limit = 50, offset = 0 } = req.query;
    const { role, id: userId } = req.user;

    let query = supabase.from('applications').select('*', { count: 'exact' });

    // Role-based filtering
    if (role === 'Loan Officer') {
      query = query.neq('stage', 'offer').neq('stage', 'complete');
    } else if (role === 'Credit Admin') {
      query = query.eq('stage', 'assessment');
    }

    // Stage filter
    if (stage) {
      query = query.eq('stage', stage);
    }

    // Declined filter
    if (declined !== undefined) {
      query = query.eq('declined', declined === 'true');
    }

    const { data: applications, error, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      applications,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update application stage
export const updateApplicationStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, message } = req.body;
    const { id: userId } = req.user;

    if (!['intake', 'docs', 'assessment', 'approval', 'offer', 'complete'].includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update application
    const { data, error } = await supabase
      .from('applications')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Add history entry
    await supabase
      .from('application_history')
      .insert([
        {
          application_id: id,
          stage,
          action_by: userId,
          message: message || `Moved to ${stage} stage`
        }
      ]);

    res.json({
      success: true,
      message: 'Application stage updated',
      application: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save credit assessment
export const saveCreditAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { creditScore, creditOutcome, creditNotes } = req.body;

    const { data, error } = await supabase
      .from('applications')
      .update({
        credit_score: creditScore,
        credit_outcome: creditOutcome,
        credit_notes: creditNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Credit assessment saved',
      application: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve or decline application
export const managerDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;
    const { id: userId } = req.user;

    if (!['approve', 'decline', 'more_info'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    let updateData = { updated_at: new Date().toISOString() };

    if (decision === 'approve') {
      updateData.stage = 'offer';
      updateData.declined = false;
    } else if (decision === 'decline') {
      updateData.stage = 'complete';
      updateData.declined = true;
      updateData.declined_reason = reason;
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Add history
    const historyMsg = decision === 'approve' ? 'Application approved - offer issued'
                     : decision === 'decline' ? `Application declined: ${reason}`
                     : 'More information requested from applicant';

    await supabase
      .from('application_history')
      .insert([
        {
          application_id: id,
          stage: updateData.stage || (await supabase.from('applications').select('stage').eq('id', id).single()).data.stage,
          action_by: userId,
          message: historyMsg
        }
      ]);

    res.json({
      success: true,
      message: `Application ${decision}d`,
      application: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send counter-offer
export const sendCounterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, term, note } = req.body;
    const { id: userId, name: userName } = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const { data, error } = await supabase
      .from('applications')
      .update({
        counter_offer_amount: parseFloat(amount),
        counter_offer_term: parseInt(term),
        counter_offer_note: note,
        counter_offer_status: 'pending',
        counter_offer_issued_by: userName,
        counter_offer_issued_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Add history
    await supabase
      .from('application_history')
      .insert([
        {
          application_id: id,
          stage: 'complete',
          action_by: userId,
          message: `Counter-offer of $${amount} sent for re-review`
        }
      ]);

    res.json({
      success: true,
      message: 'Counter-offer sent',
      application: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update counter-offer status
export const updateCounterOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { id: userId } = req.user;

    if (!['pending', 'accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let updateData = {
      counter_offer_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'accepted') {
      updateData.declined = false;
      updateData.stage = 'assessment';
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Add history
    await supabase
      .from('application_history')
      .insert([
        {
          application_id: id,
          stage: updateData.stage || 'complete',
          action_by: userId,
          message: `Counter-offer ${status} by applicant`
        }
      ]);

    res.json({
      success: true,
      message: `Counter-offer ${status}`,
      application: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get analytics
export const getAnalytics = async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*');

    if (error) throw error;

    const total = applications.length;
    const byStage = {};
    const declined = applications.filter(a => a.declined);
    const completed = applications.filter(a => a.stage === 'offer' || a.stage === 'complete');

    applications.forEach(app => {
      byStage[app.stage] = (byStage[app.stage] || 0) + 1;
    });

    const totalValue = applications.reduce((sum, app) => sum + (app.loan_amount || 0), 0);
    const avgLoan = total > 0 ? Math.round(totalValue / total) : 0;
    const approvalRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        total,
        totalValue,
        avgLoan,
        approvalRate,
        declined: declined.length,
        completed: completed.length,
        byStage,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
