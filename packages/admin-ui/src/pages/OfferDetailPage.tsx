import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '@/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';

interface OfferDetail {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  availability: string;
  organization_id: string | null;
  organization_name: string | null;
  checkout_url: string | null;
  tags: string | null;
  status: string;
  distribution_enabled: boolean;
  source?: string;
  video_url?: string | null;
  tickets_available?: number | null;
  fevo_offer_id?: string | null;
  fevo_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

const Container = styled.div`
  max-width: 900px;
`;

const Card = styled.div`
  background: white;
  border-radius: ${radius.cornerRadiusLg};
  border: 1px solid ${colors.border.neutral.primary};
  box-shadow: ${shadows.sm};
  padding: ${spacings['2xl']};
  margin-bottom: ${spacings.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.neutral.primary};
  margin: 0 0 ${spacings.xl} 0;
  padding-bottom: ${spacings.md};
  border-bottom: 1px solid ${colors.border.neutral.subtle};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacings.xl};
`;

const FormGroup = styled.div<{ $full?: boolean }>`
  grid-column: ${(p) => (p.$full ? '1 / -1' : 'auto')};
`;

const Label = styled.label`
  display: block;
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.secondary};
  margin-bottom: ${spacings.sm};
`;

const Input = styled.input`
  width: 100%;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};
  min-height: 100px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};
  background: white;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const MetaBadges = styled.div`
  display: flex;
  gap: ${spacings.md};
  margin-bottom: ${spacings.xl};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${spacings.md};
  justify-content: flex-end;
  margin-top: ${spacings.xl};
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' }>`
  padding: ${spacings.md} ${spacings.lg};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings.xl};
  background: ${(p) => (p.$type === 'success' ? '#f0fdf4' : '#fef2f2')};
  color: ${(p) => (p.$type === 'success' ? '#166534' : '#991b1b')};
  font-size: ${typography.fontSize.sm};
`;

export const OfferDetailPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [venueState, setVenueState] = useState('');
  const [availability, setAvailability] = useState('available');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  const fetchOffer = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: OfferDetail }>(`/admin/offers/${offerId}`);
      const o = res.data.data;
      setOffer(o);
      setTitle(o.title || '');
      setDescription(o.description || '');
      setImageUrl(o.image_url || '');
      setVideoUrl(o.video_url || '');
      setPriceMin(o.price_min != null ? String(o.price_min) : '');
      setPriceMax(o.price_max != null ? String(o.price_max) : '');
      setCurrency(o.currency || 'USD');
      setDate(o.date || '');
      setVenueName(o.venue_name || '');
      setVenueCity(o.venue_city || '');
      setVenueState(o.venue_state || '');
      setAvailability(o.availability || 'available');
      setCheckoutUrl(o.checkout_url || '');
      try {
        const tags = o.tags ? JSON.parse(o.tags) : [];
        setTagsStr(tags.join(', '));
      } catch {
        setTagsStr('');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load offer' });
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    fetchOffer();
  }, [fetchOffer]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const tags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await apiClient.put(`/admin/offers/${offerId}`, {
        title,
        description: description || null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        price_min: priceMin ? Number(priceMin) : null,
        price_max: priceMax ? Number(priceMax) : null,
        currency,
        date: date || null,
        venue_name: venueName || null,
        venue_city: venueCity || null,
        venue_state: venueState || null,
        availability,
        checkout_url: checkoutUrl || null,
        tags: tags.length > 0 ? tags : null,
      });
      setMessage({ type: 'success', text: 'Offer updated successfully' });
      fetchOffer();
    } catch {
      setMessage({ type: 'error', text: 'Failed to update offer' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Container><PageHeader title="Loading..." /></Container>;
  }

  if (!offer) {
    return <Container><PageHeader title="Offer Not Found" /></Container>;
  }

  return (
    <Container>
      <PageHeader title="Edit Offer" />

      <MetaBadges>
        <Badge>{offer.status}</Badge>
        <Badge>{offer.source || 'manual'}</Badge>
        {offer.fevo_offer_id && <Badge>FEVO: {offer.fevo_offer_id}</Badge>}
        {offer.distribution_enabled && <Badge>Distributed</Badge>}
      </MetaBadges>

      {message && <StatusMessage $type={message.type}>{message.text}</StatusMessage>}

      <Card>
        <SectionTitle>Basic Information</SectionTitle>
        <FormGrid>
          <FormGroup $full>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormGroup>
          <FormGroup $full>
            <Label>Description</Label>
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormGroup>
          <FormGroup $full>
            <Label>Tags (comma-separated)</Label>
            <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="nba, theme-night, hello-kitty" />
          </FormGroup>
        </FormGrid>
      </Card>

      <Card>
        <SectionTitle>Media</SectionTitle>
        <FormGrid>
          <FormGroup $full>
            <Label>Image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </FormGroup>
          <FormGroup $full>
            <Label>Video URL</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
          </FormGroup>
        </FormGrid>
      </Card>

      <Card>
        <SectionTitle>Pricing &amp; Availability</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label>Min Price</Label>
            <Input type="number" step="0.01" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Max Price</Label>
            <Input type="number" step="0.01" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Availability</Label>
            <SelectInput value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="sold_out">Sold Out</option>
            </SelectInput>
          </FormGroup>
        </FormGrid>
      </Card>

      <Card>
        <SectionTitle>Event &amp; Venue</SectionTitle>
        <FormGrid>
          <FormGroup $full>
            <Label>Date (ISO format)</Label>
            <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026-04-15T19:00:00Z" />
          </FormGroup>
          <FormGroup>
            <Label>Venue Name</Label>
            <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Venue City</Label>
            <Input value={venueCity} onChange={(e) => setVenueCity(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Venue State</Label>
            <Input value={venueState} onChange={(e) => setVenueState(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Checkout URL</Label>
            <Input value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} />
          </FormGroup>
        </FormGrid>
      </Card>

      <ButtonRow>
        <Button variant="secondary" onClick={() => navigate('/offers')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </ButtonRow>
    </Container>
  );
};
