import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Button,
  IconButton,
  Divider,
  Stack,
  TextField,
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import PhoneIcon from '@mui/icons-material/Phone';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router';
import { BrandMark } from '../common/components/BrandMark';

const linkSx = {
  color: 'rgba(255,255,255,.72)',
  textTransform: 'none' as const,
  justifyContent: 'flex-start',
  px: 0,
  fontWeight: 500,
  '&:hover': { color: '#fff', background: 'transparent' },
};

function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Explore',
      links: [
        { label: 'Destinations', path: '/destinations' },
        { label: 'Activities', path: '/activities' },
        { label: 'Packages', path: '/packages' },
        { label: 'About Us', path: '/about' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'My Bookings', path: '/dashboard/bookings' },
        { label: 'My Wishlist', path: '/dashboard/wishlist' },
        { label: 'Host an activity', path: '/activities/create' },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        mt: 10,
        color: 'rgba(255,255,255,.72)',
        background: 'linear-gradient(160deg, #123D28 0%, #0C2C1D 100%)',
        pt: { xs: 6, md: 8 },
        pb: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          {/* Brand + newsletter */}
          <Grid item xs={12} md={4}>
            <Box sx={{ '& *': { color: '#fff !important' } }}>
              <BrandMark light />
            </Box>
            <Typography sx={{ mt: 2, mb: 3, lineHeight: 1.8, maxWidth: 320 }}>
              Group travel across Nepal — join a trip, meet your crew, and explore further together.
            </Typography>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,.6)' }}>
              Trip ideas in your inbox
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, maxWidth: 340 }}>
              <TextField
                size="small"
                placeholder="you@email.com"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,.08)',
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,.2)' },
                  },
                  '& input::placeholder': { color: 'rgba(255,255,255,.5)' },
                }}
              />
              <IconButton
                sx={{
                  bgcolor: 'primary.main',
                  color: '#fff',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Stack>
          </Grid>

          {columns.map(col => (
            <Grid item xs={6} md={2} key={col.title}>
              <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1.5 }}>
                {col.title}
              </Typography>
              <Stack>
                {col.links.map(l => (
                  <Button key={l.label} size="small" sx={linkSx} onClick={() => navigate(l.path)}>
                    {l.label}
                  </Button>
                ))}
              </Stack>
            </Grid>
          ))}

          {/* Contact */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1.5 }}>
              Get in touch
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <MailIcon fontSize="small" sx={{ color: 'primary.light' }} />
                <Link
                  href="mailto:minorproject856@gmail.com"
                  sx={{ color: 'rgba(255,255,255,.8)' }}
                >
                  minorproject856@gmail.com
                </Link>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ color: 'primary.light' }} />
                <Link href="tel:+97798" sx={{ color: 'rgba(255,255,255,.8)' }}>
                  +977 98**** ****
                </Link>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              {[FacebookIcon, InstagramIcon, YouTubeIcon].map((Icon, i) => (
                <IconButton
                  key={i}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,.1)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.main' },
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,.14)', my: 4 }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.6)' }}>
            © {currentYear} YatruSathi. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {['Terms', 'Privacy', 'Cookies'].map(t => (
              <Link
                key={t}
                href={`#${t.toLowerCase()}`}
                sx={{ color: 'rgba(255,255,255,.6)', fontSize: '.875rem' }}
              >
                {t}
              </Link>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
