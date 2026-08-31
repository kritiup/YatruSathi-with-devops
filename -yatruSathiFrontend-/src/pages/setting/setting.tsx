import { useState, type ReactNode } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Alert,
} from '@mui/material';

/* =======================
   Tab Panel Types
======================= */
interface TabPanelProps {
  value: number;
  index: number;
  children?: ReactNode;
}

/* =======================
   Tab Panel Component
======================= */
function TabPanel({ value, index, children }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ mt: 2 }}>{children}</Box>;
}

/* =======================
   Settings Page
======================= */
export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [success, setSuccess] = useState('');

  const handleSave = () => {
    setSuccess('Settings updated successfully');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '80vh', p: 3 }}>
      {/* Sidebar Tabs */}
      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_, newValue: number) => setTab(newValue)}
        sx={{
          minWidth: 230,
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        <Tab label="Profile" />
        <Tab label="Privacy" />
        <Tab label="Security" />
        <Tab label="Notifications" />
        <Tab label="Account" />
      </Tabs>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, pl: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="#022B3A">
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Manage your account preferences and verification
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* ================= PROFILE ================= */}
        <TabPanel value={tab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Profile Settings
              </Typography>
              <Stack spacing={2}>
                <TextField label="Full Name" fullWidth />
                <TextField label="City / District" fullWidth />
                <TextField
                  label="Bio"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Tell something about yourself"
                />
                <Button variant="contained" onClick={handleSave}>
                  Save Profile
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ================= PRIVACY ================= */}
        <TabPanel value={tab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Privacy & Visibility
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Allow profile visibility to event organizers"
                />
                <FormControlLabel control={<Switch />} label="Show age range on profile" />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Allow AI-based recommendations"
                />
                <Button variant="contained" onClick={handleSave}>
                  Update Privacy
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ================= SECURITY ================= */}
        <TabPanel value={tab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Security
              </Typography>
              <Stack spacing={2}>
                <TextField label="Email Address" value="user@yatrusathi.com" disabled />
                <TextField label="Change Password" type="password" />
                <FormControlLabel
                  control={<Switch />}
                  label="Enable two-step verification (future)"
                />
                <Typography color="success.main">✔ ID Verification: Verified</Typography>
                <Button variant="contained" onClick={handleSave}>
                  Update Security
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ================= NOTIFICATIONS ================= */}
        <TabPanel value={tab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Notification Preferences
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Event approval updates"
                />
                <FormControlLabel control={<Switch defaultChecked />} label="Group messages" />
                <FormControlLabel control={<Switch />} label="Event reminders" />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="AI travel suggestions"
                />
                <Button variant="contained" onClick={handleSave}>
                  Save Preferences
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ================= ACCOUNT ================= */}
        <TabPanel value={tab} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Account Management
              </Typography>
              <Stack spacing={2}>
                <Button variant="outlined" color="warning">
                  Deactivate Account
                </Button>
                <Divider />
                <Button variant="contained" color="error">
                  Delete Account
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </Box>
  );
}
