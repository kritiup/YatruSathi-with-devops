import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Grid,
  Tabs,
  Tab,
  Paper,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@mui/material';
import {
  Close,
  People,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { AdminLayout } from '../../components/admin/AdminLayout';

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_BASE_URL = RAW_API_BASE_URL.trim().replace(/\/+$/, '');

type KycStatus = 'pending' | 'approved' | 'rejected';

type KycRequest = {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  father_spouse_name?: string;
  gender?: string;
  marital_status?: string;
  date_of_birth?: string;
  nationality?: string;
  residential_status?: string;
  document_type?: string;
  citizenship_number: string;
  document_image?: string | null;
  kyc_photo?: string | null;
  signature?: string | null;
  status: KycStatus;
  is_kyc_verified: boolean;
  created_at: string;
};

type KycStats = {
  total_users: number;
  verified: number;
  pending: number;
  rejected: number;
  success_rate: number;
};

type TrendData = {
  name: string;
  total: number;
  verified: number;
  rejected: number;
  pending: number;
};

const statusColor: Record<KycStatus, 'default' | 'success' | 'error' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

interface KycApprovalPageProps {
  defaultTab?: number;
}

export const KycApprovalPage: React.FC<KycApprovalPageProps> = ({ defaultTab = 0 }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<KycStatus | 'all'>('pending');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [stats, setStats] = useState<KycStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  // Office Use Only state
  const [auditorFields, setAuditorFields] = useState({
    auditorFirstName: '',
    auditorLastName: '',
    verifiedOriginals: false,
    auditDate: new Date().toISOString().split('T')[0],
    signature: '',
  });

  const fetchStats = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/kyc-stats/`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setStats(response.data.stats);
      setTrendData(response.data.trends);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken || adminToken === 'null' || adminToken === 'undefined') {
        setError('Session expired. Please login again.');
        return;
      }
      const response = await axios.get(
        `${API_BASE_URL}/admin/kyc-requests/?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      setRequests(response.data.kyc_requests || []);
    } catch (err: unknown) {
      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 401 || err.response?.status === 403)
      ) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        navigate('/admin/login');
      } else if (axios.isAxiosError(err)) {
        const apiError = err.response?.data as { error?: string } | undefined;
        setError(apiError?.error || 'Failed to fetch KYC requests');
      } else {
        setError('Failed to fetch KYC requests');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, navigate]);

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    const adminToken = localStorage.getItem('adminToken');
    if (!isAdmin || !adminToken) {
      navigate('/admin/login');
    } else {
      fetchRequests();
      fetchStats();
    }
  }, [navigate, fetchRequests, fetchStats]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleUpdateStatus = async (id: number, status: KycStatus) => {
    setError('');
    setSuccess('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/admin/kyc-requests/${id}/`,
        {
          status,
          // We could send auditor information here if the backend supports it
          auditor_data: auditorFields,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      setSuccess(`KYC request ${status} successfully!`);
      fetchRequests();
      fetchStats();
      setSelectedRequest(null);
    } catch (err: unknown) {
      setError('Failed to update KYC status');
    }
  };

  const rows = useMemo(() => requests, [requests]);

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={700}
              sx={{ lineHeight: 1.2, display: 'block', mb: 1 }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b' }}>
              {value}
            </Typography>
            {trend && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16, color: '#10b981' }} />
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                  {trend}
                </Typography>
              </Stack>
            )}
          </Box>
          <Box
            sx={{
              p: 1,
              bgcolor: color === 'primary' ? 'primary.light' : `${color}.light`,
              borderRadius: 1.5,
              color: '#fff',
              display: 'flex',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout
      title="KYC verification insights"
      subtitle="Monitor your verification rates and where users run into errors."
    >
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab label="Overview" sx={{ fontWeight: 700, textTransform: 'none', px: 4 }} />
          <Tab label="Requests" sx={{ fontWeight: 700, textTransform: 'none', px: 4 }} />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {activeTab === 0 && (
        <Stack spacing={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total account holders"
                value={stats?.total_users || 0}
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="In review"
                value={stats?.pending || 0}
                icon={<Pending />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Verified"
                value={stats?.verified || 0}
                icon={<CheckCircle />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Unsuccessful"
                value={stats?.rejected || 0}
                icon={<ErrorIcon />}
                color="error"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: 450,
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Monthly Verification Trends
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar
                        dataKey="verified"
                        name="Verified"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                      <Bar
                        dataKey="pending"
                        name="In review"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                      <Bar
                        dataKey="rejected"
                        name="Unsuccessful"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </ReBarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: 450,
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Status Ratio
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Verified', value: stats?.verified || 0 },
                          { name: 'Pending', value: stats?.pending || 0 },
                          { name: 'Rejected', value: stats?.rejected || 0 },
                        ]}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}

      {activeTab === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" fontWeight={700}>
                Filter by:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as KycStatus | 'all')}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Document ID / NID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Submitted Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress sx={{ my: 4 }} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography sx={{ py: 4 }} color="text.secondary">
                        No requests found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(req => (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {req.full_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{req.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{req.citizenship_number || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={req.status}
                          color={statusColor[req.status]}
                          size="small"
                          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                            onClick={() => setSelectedRequest(req)}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}
                            disabled={req.status === 'approved'}
                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                          >
                            Approve
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* KYC Details Dialog */}
      <Dialog
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, bgcolor: '#f4f7f6' } }}
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}
        >
          <Typography variant="h5" fontWeight={800}>
            KYC Verification Review
          </Typography>
          <IconButton onClick={() => setSelectedRequest(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {selectedRequest && (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 2,
                mx: 'auto',
                maxWidth: 900,
                border: '1px solid #e0e0e0',
                bgcolor: '#fff',
              }}
            >
              <Stack spacing={6}>
                {/* User Info Form View */}
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    color="primary"
                    sx={{ mb: 4, pb: 1, borderBottom: '2px solid', borderColor: 'primary.light' }}
                  >
                    Section A: Applicant Information
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Full Name
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem', mt: 0.5 }}>
                        {selectedRequest.full_name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Father's/Spouse's Name
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem', mt: 0.5 }}>
                        {selectedRequest.father_spouse_name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Gender
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, textTransform: 'capitalize' }}>
                        {selectedRequest.gender || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Date of Birth
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedRequest.date_of_birth || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Nationality
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedRequest.nationality || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    color="primary"
                    sx={{ mb: 4, pb: 1, borderBottom: '2px solid', borderColor: 'primary.light' }}
                  >
                    Section B: Identity & Documents
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Document Type
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontSize: '1.1rem', mt: 0.5, textTransform: 'uppercase' }}
                      >
                        {selectedRequest.document_type || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        NID / Document number
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem', mt: 0.5 }}>
                        {selectedRequest.citizenship_number || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          mb: 2,
                          display: 'block',
                        }}
                      >
                        Submitted Documents
                      </Typography>
                      <Grid container spacing={2}>
                        {[
                          { label: 'User Photo', url: selectedRequest.kyc_photo },
                          { label: 'Document Image', url: selectedRequest.document_image },
                          { label: 'Signature', url: selectedRequest.signature },
                        ].map((doc, idx) => (
                          <Grid item xs={12} md={4} key={idx}>
                            <Box
                              sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                p: 1,
                                textAlign: 'center',
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                display="block"
                                sx={{ mb: 1 }}
                              >
                                {doc.label}
                              </Typography>
                              {doc.url ? (
                                <Box
                                  component="img"
                                  src={doc.url}
                                  onClick={() => setSelectedImage(doc.url!)}
                                  sx={{
                                    width: '100%',
                                    aspectRatio: '4/3',
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    cursor: 'zoom-in',
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: '100%',
                                    aspectRatio: '4/3',
                                    bgcolor: '#f5f5f5',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Typography variant="caption" color="text.disabled">
                                    No image
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>

                {/* For Office Use Only Section */}
                <Box
                  sx={{ bgcolor: '#f8fafc', p: 4, borderRadius: 2, border: '1px solid #e0e0e0' }}
                >
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{
                      mb: 4,
                      color: '#1e293b',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    For Office Use Only
                  </Typography>

                  <Stack spacing={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={auditorFields.verifiedOriginals}
                          onChange={e =>
                            setAuditorFields({
                              ...auditorFields,
                              verifiedOriginals: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Typography variant="body1" fontWeight={600}>
                          Originals verified and Self-Attested Document copies received
                        </Typography>
                      }
                    />

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          variant="outlined"
                          value={auditorFields.auditorFirstName}
                          onChange={e =>
                            setAuditorFields({ ...auditorFields, auditorFirstName: e.target.value })
                          }
                          helperText="Name of the Authorized Signatory"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          variant="outlined"
                          value={auditorFields.auditorLastName}
                          onChange={e =>
                            setAuditorFields({ ...auditorFields, auditorLastName: e.target.value })
                          }
                          helperText="Name of the Authorized Signatory"
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Date Signed"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={auditorFields.auditDate}
                          onChange={e =>
                            setAuditorFields({ ...auditorFields, auditDate: e.target.value })
                          }
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={3} justifyContent="center" sx={{ pt: 4 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    sx={{
                      px: 8,
                      py: 2,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      bgcolor: '#10b981',
                      '&:hover': { bgcolor: '#059669' },
                    }}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                  >
                    Submit Approval
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    sx={{ px: 4, py: 2, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  >
                    Reject KYC
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Preview */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{ position: 'absolute', right: -40, top: -40, color: 'white' }}
          >
            <Close />
          </IconButton>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              sx={{ width: '100%', height: 'auto', maxHeight: '90vh', borderRadius: 2 }}
            />
          )}
        </Box>
      </Dialog>
    </AdminLayout>
  );
};
