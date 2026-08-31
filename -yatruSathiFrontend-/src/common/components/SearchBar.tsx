import React, { useState } from 'react';
import { Box, Button, Divider, InputBase, MenuItem, Select, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import HikingIcon from '@mui/icons-material/Hiking';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { useNavigate } from 'react-router';
import { ROUTES } from '../constants/routes';

const ACTIVITY_OPTIONS = [
  'Any Activity',
  'Trekking',
  'Rafting',
  'Paragliding',
  'Cultural Tour',
  'Camping',
  'Jungle Safari',
];

interface Field {
  icon: React.ReactNode;
  node: React.ReactNode;
}

/**
 * The home-page search bar: Where / Activity / Date / Guests, styled as one
 * connected pill on desktop and a stacked card on mobile. Submitting routes to
 * the Activities page with the chosen filters as query params.
 */
export const SearchBar: React.FC<{ dense?: boolean }> = ({ dense = false }) => {
  const navigate = useNavigate();
  const [where, setWhere] = useState('');
  const [activity, setActivity] = useState(ACTIVITY_OPTIONS[0]);
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');

  const submit = () => {
    const params = new URLSearchParams();
    if (where.trim()) params.set('search', where.trim());
    if (activity && activity !== ACTIVITY_OPTIONS[0]) params.set('type', activity);
    if (date) params.set('date', date);
    if (guests) params.set('guests', guests);
    navigate(`${ROUTES.activities}?${params.toString()}`);
  };

  const fields: Field[] = [
    {
      icon: <PlaceOutlinedIcon fontSize="small" color="action" />,
      node: (
        <InputBase
          fullWidth
          placeholder="Where to?"
          value={where}
          onChange={e => setWhere(e.target.value)}
          sx={{ fontSize: '0.95rem' }}
        />
      ),
    },
    {
      icon: <HikingIcon fontSize="small" color="action" />,
      node: (
        <Select
          fullWidth
          variant="standard"
          disableUnderline
          value={activity}
          onChange={e => setActivity(e.target.value)}
          sx={{ fontSize: '0.95rem' }}
        >
          {ACTIVITY_OPTIONS.map(o => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      icon: <EventOutlinedIcon fontSize="small" color="action" />,
      node: (
        <InputBase
          fullWidth
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          sx={{ fontSize: '0.95rem', color: date ? 'text.primary' : 'text.secondary' }}
        />
      ),
    },
    {
      icon: <PeopleAltOutlinedIcon fontSize="small" color="action" />,
      node: (
        <InputBase
          fullWidth
          type="number"
          placeholder="Guests"
          value={guests}
          onChange={e => setGuests(e.target.value)}
          inputProps={{ min: 1 }}
          sx={{ fontSize: '0.95rem' }}
        />
      ),
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: { xs: 3, md: 999 },
        boxShadow: '0 18px 44px -22px rgba(23,37,30,0.4)',
        p: { xs: 1.5, md: 0.75 },
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: { xs: 1, md: 0 },
      }}
    >
      {fields.map((f, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', md: 'block' }, my: 1 }}
            />
          )}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              flex: 1,
              px: { xs: 1, md: 2.5 },
              py: { xs: 0.75, md: dense ? 0.75 : 1.25 },
              minWidth: 0,
            }}
          >
            {f.icon}
            <Box sx={{ flex: 1, minWidth: 0 }}>{f.node}</Box>
          </Stack>
        </React.Fragment>
      ))}
      <Button
        variant="contained"
        onClick={submit}
        startIcon={<SearchIcon />}
        sx={{
          borderRadius: { xs: 2, md: 999 },
          px: 3,
          py: 1.25,
          m: { xs: 0, md: 0.5 },
          flexShrink: 0,
        }}
      >
        Search
      </Button>
    </Box>
  );
};

export default SearchBar;
