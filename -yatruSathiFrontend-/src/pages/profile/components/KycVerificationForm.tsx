import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import type { KycFormState, UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  message: string;
  kycForm: KycFormState;
  setKycForm: React.Dispatch<React.SetStateAction<KycFormState>>;
  kycFile: File | null;
  setKycFile: (file: File | null) => void;
  userPhoto: File | null;
  setUserPhoto: (file: File | null) => void;
  signatureFile: File | null;
  setSignatureFile: (file: File | null) => void;
  kycSaving: boolean;
  onSubmit: () => void;
}

export const KycVerificationForm: React.FC<Props> = ({
  profile,
  message,
  kycForm,
  setKycForm,
  kycFile,
  setKycFile,
  userPhoto,
  setUserPhoto,
  signatureFile,
  setSignatureFile,
  kycSaving,
  onSubmit,
}) => {
  const update = (patch: Partial<KycFormState>) => setKycForm(prev => ({ ...prev, ...patch }));

  return (
    <Box>
      <Box id="kyc-section">
        <Typography
          variant="h5"
          fontWeight={800}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          KYC Verification {profile.is_kyc_verified && <VerifiedIcon color="success" />}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Verify your identity to build trust within the community and unlock professional features.
        </Typography>

        {message && (
          <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {profile.is_kyc_verified ? (
          <Alert severity="success" sx={{ borderRadius: 3 }}>
            Your account is fully verified. Thank you for completing the KYC process!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 1, color: 'primary.main' }}
              >
                Section A: Identity Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Legal Name"
                placeholder="Enter your full name"
                value={kycForm.full_name}
                onChange={e => update({ full_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's/Spouse's Name"
                placeholder="Enter father or spouse name"
                value={kycForm.father_spouse_name}
                onChange={e => update({ father_spouse_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                InputLabelProps={{ shrink: true }}
                value={kycForm.gender}
                onChange={e => update({ gender: e.target.value })}
                required
                SelectProps={{ native: true }}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Marital Status"
                InputLabelProps={{ shrink: true }}
                value={kycForm.marital_status}
                onChange={e => update({ marital_status: e.target.value })}
                required
                SelectProps={{ native: true }}
              >
                <option value="">Select Marital Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                value={kycForm.date_of_birth}
                onChange={e => update({ date_of_birth: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nationality"
                placeholder="e.g. Nepali"
                value={kycForm.nationality}
                onChange={e => update({ nationality: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                InputLabelProps={{ shrink: true }}
                value={kycForm.residential_status}
                onChange={e => update({ residential_status: e.target.value })}
                required
                SelectProps={{ native: true }}
              >
                <option value="">Select Status</option>
                <option value="resident">Resident Individual</option>
                <option value="non_resident">Non Resident</option>
                <option value="foreign_national">Foreign National</option>
              </TextField>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 1, color: 'primary.main' }}
              >
                Section B: Document Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Document Type"
                InputLabelProps={{ shrink: true }}
                value={kycForm.document_type}
                onChange={e => update({ document_type: e.target.value })}
                required
                SelectProps={{ native: true }}
              >
                <option value="">Select Document Type</option>
                <option value="nid">National ID (NID)</option>
                <option value="passport">Passport</option>
                <option value="voter_id">Voter ID</option>
                <option value="driving_license">Driving License</option>
                <option value="other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="NID / Document Number"
                placeholder="Enter ID number"
                value={kycForm.citizenship_number}
                onChange={e => update({ citizenship_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(0,0,0,0.01)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" mb={1} color="text.secondary" fontWeight={600}>
                  Photo of Applicant
                </Typography>
                <Button variant="outlined" component="label" size="small">
                  {userPhoto ? userPhoto.name : 'Choose Photo'}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={e => setUserPhoto(e.target.files?.[0] || null)}
                  />
                </Button>
                {userPhoto && (
                  <Typography variant="caption" color="success.main" mt={1}>
                    ✓ Selected
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(59, 130, 246, 0.03)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" mb={1} color="primary" fontWeight={700}>
                  Document Image
                </Typography>
                <Button variant="contained" component="label" size="small">
                  {kycFile ? kycFile.name : 'Upload Document'}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={e => setKycFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {kycFile && (
                  <Typography variant="caption" color="success.main" mt={1}>
                    ✓ Selected
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 1, color: 'primary.main' }}
              >
                Section C: Signature
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(0,0,0,0.01)',
                }}
              >
                <Typography variant="body2" mb={1.5} color="text.secondary" fontWeight={600}>
                  Digital Signature / Upload Signature Photo
                </Typography>
                <Button variant="outlined" component="label" size="small">
                  {signatureFile ? signatureFile.name : 'Choose Signature Image'}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={e => setSignatureFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {signatureFile && (
                  <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                    ✓ Signature selected: {signatureFile.name}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Ensure all information matches your official document.
                  Your submission will be reviewed by our team within 24-48 hours.
                </Typography>
              </Alert>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={onSubmit}
                disabled={
                  kycSaving ||
                  !kycForm.full_name ||
                  !kycForm.father_spouse_name ||
                  !kycForm.gender ||
                  !kycForm.date_of_birth ||
                  !kycForm.document_type ||
                  !kycForm.citizenship_number ||
                  !kycFile ||
                  !userPhoto ||
                  !signatureFile
                }
                sx={{ py: 2, borderRadius: 2, fontWeight: 700 }}
              >
                {kycSaving ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Submit KYC Verification'
                )}
              </Button>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default KycVerificationForm;
