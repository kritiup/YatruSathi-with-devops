import { useEffect, useState } from 'react';
import api from '../../../api/api';
import { profileService } from '../../../services/api/profile';
import { eventService } from '../../../services/api/events';
import { toList } from '../../../common/utils/formatters';
import {
  EMPTY_KYC_FORM,
  EMPTY_PROFILE,
  type KycFormState,
  type ProfileChatMessage,
  type ProfileEvent,
  type ProfileSummary,
  type Review,
  type UserProfile,
} from '../types';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

interface Params {
  viewingUserId: number | null;
  isViewingOtherUser: boolean;
}

/**
 * All data-fetching and mutations for the profile page: the profile itself,
 * the owner's created events with their reviews/chats, KYC submission, avatar
 * upload, and the complete/cancel event actions.
 */
export function useProfileData({ viewingUserId, isViewingOtherUser }: Params) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [avatar, setAvatar] = useState<string>('/images/user-avatar.jpg');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [publicSummary, setPublicSummary] = useState<{
    organizer?: ProfileSummary;
    participant?: ProfileSummary;
  } | null>(null);

  const [myEvents, setMyEvents] = useState<ProfileEvent[]>([]);
  const [eventReviews, setEventReviews] = useState<Record<number, Review[]>>({});
  const [eventChats, setEventChats] = useState<Record<number, ProfileChatMessage[]>>({});
  const [eventsLoading, setEventsLoading] = useState(false);

  const [kycForm, setKycForm] = useState<KycFormState>(EMPTY_KYC_FORM);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [kycSaving, setKycSaving] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const endpoint =
          isViewingOtherUser && viewingUserId !== null
            ? `users/${viewingUserId}/profile/`
            : 'profile/';
        const response = await api.get(endpoint);
        setProfile(response.data);
        if (!isViewingOtherUser) {
          setKycForm({
            full_name: response.data.full_name || '',
            father_spouse_name: response.data.father_spouse_name || '',
            gender: response.data.gender || '',
            marital_status: response.data.marital_status || '',
            date_of_birth: response.data.date_of_birth || '',
            nationality: response.data.nationality || '',
            residential_status: response.data.residential_status || '',
            document_type: response.data.document_type || '',
            citizenship_number: response.data.citizenship_number || '',
          });
          setPublicSummary(null);
        } else {
          setPublicSummary({
            organizer: response.data.organizer_summary,
            participant: response.data.participant_summary,
          });
        }
        if (response.data.avatar) {
          setAvatar(response.data.avatar);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isViewingOtherUser, viewingUserId]);

  useEffect(() => {
    const fetchEventsAndReviews = async () => {
      if (isViewingOtherUser) return;
      if (!profile.id) return;

      try {
        setEventsLoading(true);
        const events = toList<ProfileEvent>(await profileService.getMyCreatedEvents());
        const userEvents = events.filter(event => event.created_by.id === profile.id);
        setMyEvents(userEvents);

        const reviewsData: Record<number, Review[]> = {};
        const chatsData: Record<number, ProfileChatMessage[]> = {};

        for (const event of userEvents) {
          try {
            reviewsData[event.id] = toList<Review>(await profileService.getEventReviews(event.id));
            chatsData[event.id] = toList<ProfileChatMessage>(
              await profileService.getEventChat(event.id)
            );
          } catch (err) {
            console.error(`Error fetching data for event ${event.id}:`, err);
            reviewsData[event.id] = [];
            chatsData[event.id] = [];
          }
        }

        setEventReviews(reviewsData);
        setEventChats(chatsData);
        setEventsLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setEventsLoading(false);
      }
    };

    if (!isViewingOtherUser && profile.id) {
      fetchEventsAndReviews();
    }
  }, [profile.id, isViewingOtherUser]);

  const submitKyc = async () => {
    setKycSaving(true);
    setMessage('');

    if (signatureFile && !signatureFile.type.startsWith('image/')) {
      setMessage('Signature photo must be an image file (JPG, PNG, etc.)');
      setKycSaving(false);
      return;
    }
    for (const [file, label] of [
      [kycFile, 'Document photo'],
      [userPhoto, 'User photo'],
      [signatureFile, 'Signature photo'],
    ] as const) {
      if (file && file.size > MAX_UPLOAD_BYTES) {
        setMessage(`${label} must be less than 5MB`);
        setKycSaving(false);
        return;
      }
    }

    const formData = new FormData();
    (Object.keys(kycForm) as (keyof KycFormState)[]).forEach(key => {
      formData.append(key, kycForm[key]);
    });
    if (kycFile) formData.append('document_image', kycFile);
    if (userPhoto) formData.append('kyc_photo', userPhoto);
    if (signatureFile) formData.append('signature', signatureFile);

    try {
      await api.put('profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('KYC application submitted successfully!');
      const response = await api.get('profile/');
      setProfile(response.data);
    } catch (error: unknown) {
      console.error('KYC submission error:', error);
      const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data;
      let errorMessage = 'Failed to submit KYC. Please try again.';
      if (data) {
        const fieldLabels: Record<string, string> = {
          document_image: 'Document Image',
          avatar: 'User Photo',
          full_name: 'Full Name',
          citizenship_number: 'Document ID',
          document_type: 'Document Type',
        };
        const field = Object.keys(fieldLabels).find(f => Array.isArray(data[f]));
        if (field) {
          errorMessage = `${fieldLabels[field]}: ${(data[field] as string[])[0]}`;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
      }
      setMessage(errorMessage);
    } finally {
      setKycSaving(false);
    }
  };

  const changeAvatar = async (file: File) => {
    if (isViewingOtherUser) return;
    setAvatar(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await api.put('profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      console.error('Error uploading avatar:', err);
    }
  };

  const saveProfile = async () => {
    if (isViewingOtherUser) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put('profile/', { bio: profile.bio, hobbies: profile.hobbies });
      setMessage('Profile updated successfully!');
    } catch {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const setEventStatus = async (
    eventId: number,
    next: 'completed' | 'cancelled'
  ): Promise<boolean> => {
    setActionLoading(true);
    try {
      if (next === 'completed') await eventService.completeEvent(eventId);
      else await eventService.cancelEvent(eventId);
      setMyEvents(prev =>
        prev.map(event => (event.id === eventId ? { ...event, status: next } : event))
      );
      setMessage(
        next === 'completed'
          ? 'Event marked as completed successfully!'
          : 'Event cancelled successfully!'
      );
      return true;
    } catch (err) {
      console.error(`Error updating event to ${next}:`, err);
      setMessage(
        next === 'completed'
          ? 'Failed to complete event. Please try again.'
          : 'Failed to cancel event. Please try again.'
      );
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
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
  };
}
