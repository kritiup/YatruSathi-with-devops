import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useProfileData } from './hooks/useProfileData';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileInfoTab } from './components/ProfileInfoTab';
import { MyEventsTab } from './components/MyEventsTab';
import { KycVerificationForm } from './components/KycVerificationForm';

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const viewingUserId = userId ? Number(userId) : null;
  const isViewingOtherUser = Number.isFinite(viewingUserId ?? Number.NaN);

  const [currentTab, setCurrentTab] = useState(0);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const {
    profile,
    setProfile,
    avatar,
    loading,
    saving,
    message,
    publicSummary,
    myEvents,
    eventReviews,
    eventChats,
    eventsLoading,
    kycForm,
    setKycForm,
    kycFile,
    setKycFile,
    userPhoto,
    setUserPhoto,
    signatureFile,
    setSignatureFile,
    kycSaving,
    actionLoading,
    submitKyc,
    changeAvatar,
    saveProfile,
    setEventStatus,
  } = useProfileData({ viewingUserId, isViewingOtherUser });

  const totalReviews = useMemo(() => Object.values(eventReviews).flat().length, [eventReviews]);
  const totalComments = useMemo(() => Object.values(eventChats).flat().length, [eventChats]);

  const organizerRatingLabel = useMemo(() => {
    const all = Object.values(eventReviews).flat();
    if (all.length === 0) return '0';
    return (all.reduce((acc, r) => acc + r.rating, 0) / all.length).toFixed(1);
  }, [eventReviews]);

  // Participant reviews are not yet fetched; kept as a placeholder as before.
  const participantRatingLabel = '0.0';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) void changeAvatar(file);
  };

  const runEventAction = async (next: 'completed' | 'cancelled') => {
    if (!selectedEventId) return;
    const ok = await setEventStatus(selectedEventId, next);
    if (ok) {
      if (next === 'completed') setCompleteDialogOpen(false);
      else setCancelDialogOpen(false);
    }
    setSelectedEventId(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 3, md: 6 }, py: 6, position: 'relative' }}>
          <ProfileHeader
            avatar={avatar}
            profile={profile}
            isViewingOtherUser={isViewingOtherUser}
            publicSummary={publicSummary}
            totalReviews={totalReviews}
            organizerRatingLabel={organizerRatingLabel}
            onAvatarChange={handleAvatarChange}
          />

          {message && (
            <Alert
              severity={message.includes('success') ? 'success' : 'error'}
              sx={{ mb: 4, borderRadius: 2 }}
            >
              {message}
            </Alert>
          )}

          <Divider sx={{ my: 4 }} />

          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ mb: 4 }}
          >
            <Tab label="Profile Info" />
            {!isViewingOtherUser && <Tab label={`My Events (${myEvents.length})`} />}
            {!isViewingOtherUser && <Tab label="KYC Verification" />}
          </Tabs>

          {currentTab === 0 && (
            <ProfileInfoTab
              isViewingOtherUser={isViewingOtherUser}
              profile={profile}
              setProfile={setProfile}
              publicSummary={publicSummary}
              createdEventsCount={myEvents.length}
              totalReviews={totalReviews}
              totalComments={totalComments}
              organizerRatingLabel={organizerRatingLabel}
              participantRatingLabel={participantRatingLabel}
              saving={saving}
              onSave={saveProfile}
            />
          )}

          {!isViewingOtherUser && currentTab === 1 && (
            <MyEventsTab
              eventsLoading={eventsLoading}
              myEvents={myEvents}
              eventReviews={eventReviews}
              eventChats={eventChats}
              onOpenComplete={id => {
                setSelectedEventId(id);
                setCompleteDialogOpen(true);
              }}
              onOpenCancel={id => {
                setSelectedEventId(id);
                setCancelDialogOpen(true);
              }}
            />
          )}

          {!isViewingOtherUser && currentTab === 2 && (
            <KycVerificationForm
              profile={profile}
              message={message}
              kycForm={kycForm}
              setKycForm={setKycForm}
              kycFile={kycFile}
              setKycFile={setKycFile}
              userPhoto={userPhoto}
              setUserPhoto={setUserPhoto}
              signatureFile={signatureFile}
              setSignatureFile={setSignatureFile}
              kycSaving={kycSaving}
              onSubmit={submitKyc}
            />
          )}
        </Box>
      </Paper>

      <Dialog
        open={completeDialogOpen}
        onClose={() => !actionLoading && setCompleteDialogOpen(false)}
      >
        <DialogTitle>Mark Event as Complete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this event as completed? This action will close the event
            and notify all participants.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => runEventAction('completed')}
            variant="contained"
            color="success"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {actionLoading ? 'Completing...' : 'Complete Event'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={() => !actionLoading && setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this event? This action cannot be undone and all
            participants will be notified.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>
            Go Back
          </Button>
          <Button
            onClick={() => runEventAction('cancelled')}
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {actionLoading ? 'Cancelling...' : 'Cancel Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
