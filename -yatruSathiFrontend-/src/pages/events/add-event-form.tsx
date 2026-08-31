import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Container,
  Paper,
  MenuItem,
  InputAdornment,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router';
import { eventService } from '../../services/api/events';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import TitleIcon from '@mui/icons-material/Title';
import Cancel from '@mui/icons-material/Cancel';

import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

interface EventFormInputs {
  title: string;
  description: string;
  location: string;
  date: string;
  category: string;
  max_participants: number;
  gender_preference: string;
  age_limit: number;
  total_expenses: number;
  advance_amount: number;
}

const categories = ['Trekking', 'Cultural', 'Adventure', 'Wildlife', 'Music', 'Food', 'Other'];
const genderPreferences = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male Only' },
  { value: 'female', label: 'Female Only' },
];

const AddEventForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormInputs>({
    defaultValues: {
      category: 'Adventure',
      gender_preference: 'any',
      max_participants: 10,
      age_limit: 18,
      total_expenses: 0,
      advance_amount: 0,
    },
  });

  const totalExpensesValue = watch('total_expenses');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EventFormInputs) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('location', data.location);
    formData.append('date', data.date);
    formData.append('category', data.category);
    formData.append('max_participants', data.max_participants.toString());
    formData.append('gender_preference', data.gender_preference);
    formData.append('total_expenses', data.total_expenses.toString());
    formData.append('advance_amount', data.advance_amount.toString());

    if (Number.isFinite(data.age_limit)) {
      formData.append('age_limit', data.age_limit!.toString());
    }

    if (imageFile) {
      formData.append('image', imageFile);
    }

    galleryFiles.forEach(file => {
      formData.append('gallery_images', file);
    });

    try {
      await eventService.createEvent(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/events');
      }, 2000);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { error?: string; message?: string } } }).response?.data
              ?.error ||
            (err as { response?: { data?: { error?: string; message?: string } } }).response?.data
              ?.message
          : undefined;
      setError(errorMessage || 'Error creating event. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 4 }}>
        <Typography variant="h3" component="h1" sx={{ mb: 1, fontWeight: 800 }}>
          Create New Event
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 5 }}>
          Share your next adventure with the community.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
            Event created successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Event Title"
                fullWidth
                required
                placeholder="e.g. Weekend Trek to Nagarkot"
                {...register('title', { required: 'Title is required' })}
                error={!!errors.title}
                helperText={errors.title?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TitleIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Category"
                fullWidth
                required
                {...register('category', { required: 'Category is required' })}
                error={!!errors.category}
                helperText={errors.category?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CategoryIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              >
                {categories.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Event Date"
                type="datetime-local"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                {...register('date', { required: 'Date is required' })}
                error={!!errors.date}
                helperText={errors.date?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Location"
                fullWidth
                required
                placeholder="Where is this happening?"
                {...register('location', { required: 'Location is required' })}
                error={!!errors.location}
                helperText={errors.location?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Participants"
                type="number"
                fullWidth
                required
                {...register('max_participants', {
                  required: 'Max participants is required',
                  min: { value: 1, message: 'At least 1 participant' },
                  valueAsNumber: true,
                })}
                error={!!errors.max_participants}
                helperText={errors.max_participants?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Gender Preference"
                fullWidth
                required
                {...register('gender_preference', { required: 'Gender preference is required' })}
                error={!!errors.gender_preference}
                helperText={errors.gender_preference?.message}
              >
                {genderPreferences.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Age Limit"
                type="number"
                fullWidth
                {...register('age_limit', {
                  required: 'Age limit is required',
                  min: { value: 18, message: 'Age limit must be 18 or above' },
                  valueAsNumber: true,
                })}
                error={!!errors.age_limit}
                helperText={errors.age_limit?.message}
                inputProps={{ min: 18 }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Total Traveling Cost (Per Person)"
                type="number"
                fullWidth
                required
                {...register('total_expenses', {
                  required: 'Total expenses is required',
                  min: { value: 0, message: 'Total expenses cannot be negative' },
                  valueAsNumber: true,
                })}
                error={!!errors.total_expenses}
                helperText={errors.total_expenses?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start">NPR</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Advance Amount"
                type="number"
                fullWidth
                required
                {...register('advance_amount', {
                  required: 'Advance amount is required',
                  min: { value: 0, message: 'Advance amount cannot be negative' },
                  valueAsNumber: true,
                  validate: value =>
                    value <= (Number.isFinite(totalExpensesValue) ? totalExpensesValue : 0) ||
                    'Advance cannot exceed total expenses',
                })}
                error={!!errors.advance_amount}
                helperText={errors.advance_amount?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start">NPR</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  p: 4,
                  border: '2px dashed',
                  borderColor: imagePreview ? 'primary.main' : 'divider',
                  borderRadius: 4,
                  textAlign: 'center',
                  bgcolor: 'rgba(0,0,0,0.01)',
                  transition: 'all 0.3s ease',
                }}
              >
                {imagePreview ? (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      maxHeight: 300,
                      overflow: 'hidden',
                      borderRadius: 2,
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                    />
                    <Button
                      variant="contained"
                      component="label"
                      size="small"
                      sx={{ position: 'absolute', bottom: 16, right: 16 }}
                    >
                      Change Header Photo
                      <input hidden type="file" accept="image/*" onChange={handleImageChange} />
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={2} alignItems="center">
                    <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Main Header Photo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload the primary image for your event
                      </Typography>
                    </Box>
                    <Button variant="outlined" component="label">
                      Choose Image
                      <input hidden type="file" accept="image/*" onChange={handleImageChange} />
                    </Button>
                  </Stack>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Gallery Images
              </Typography>
              <Box
                sx={{
                  p: 3,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.01)',
                }}
              >
                <Grid container spacing={2}>
                  {galleryPreviews.map((preview, index) => (
                    <Grid item xs={4} sm={2} key={index}>
                      <Box
                        sx={{
                          position: 'relative',
                          pt: '100%',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={preview}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeGalleryImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                          }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                  <Grid item xs={4} sm={2}>
                    <Button
                      component="label"
                      sx={{
                        width: '100%',
                        height: 0,
                        pt: '100%',
                        border: '1px dashed',
                        borderColor: 'primary.main',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                        }}
                      >
                        <PhotoCameraIcon color="primary" />
                        <Typography variant="caption" display="block" color="primary">
                          Add
                        </Typography>
                      </Box>
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryChange}
                      />
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={6}
                required
                placeholder="Tell everyone what makes this event special..."
                {...register('description', { required: 'Description is required' })}
                error={!!errors.description}
                helperText={errors.description?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    px: 6,
                    height: 56,
                    borderRadius: 2,
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Publish Event'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/events')}
                  sx={{ px: 4, borderRadius: 2 }}
                >
                  Cancel
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddEventForm;
