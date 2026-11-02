import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { languageNames, languages, setLanguage } from '../../i18n';
import { useAppState } from '../../state/AppState';
import { Button, Card, Field, palette, Screen, styles, Title } from '../../ui';
import { PlaceSearch } from '../../components/PlaceSearch';
import { PlaceLocation } from '../../services/places';

const eventTypes = [
  ['Kenduri Kahwin Melayu', 'eventMalay'], ['Chinese wedding', 'eventChinese'], ['Indian wedding', 'eventIndian'], ['Indonesian wedding', 'eventIndonesian'],
  ['Pertunangan', 'eventEngagement'], ['Aqiqah', 'eventAqiqah'], ['Majlis Hari Jadi', 'eventBirthday'], ['Majlis Korporat', 'eventCorporate'],
] as const;
const totalSteps = 6;

export default function Setup() {
  const { t } = useTranslation();
  const { createEvent, demoCleanupPending, acknowledgeDemo } = useAppState();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<string>(eventTypes[0][0]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [secondDate, setSecondDate] = useState('');
  const [venue, setVenue] = useState('');
  const [venueLocation, setVenueLocation] = useState<PlaceLocation>();
  const [budget, setBudget] = useState('');
  const [guests, setGuests] = useState('');

  useEffect(() => {
    if (demoCleanupPending) Alert.alert(t('oldDemoTitle'), t('oldDemoBody'), [{ text: t('continue'), onPress: acknowledgeDemo }]);
  }, [acknowledgeDemo, demoCleanupPending, t]);

  const valuesAreValid = () => {
    if (step === 2 && [date,secondDate].some((value)=>value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T12:00:00`).getTime())))) { Alert.alert(t('invalidDate')); return false; }
    if (step === 4 && [budget, guests].some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0))) { Alert.alert(t('invalidNumber')); return false; }
    return true;
  };
  const complete = () => {
    if (!valuesAreValid()) return;
    createEvent({ type, name: name.trim() || t(eventTypes.find(([id]) => id === type)?.[1] || 'eventMalay'), date: date || null, additionalDates: secondDate ? [secondDate] : [], venue: venue.trim(), venueLocation, country: type === 'Indonesian wedding' ? 'ID' : 'MY', totalBudget: budget ? Number(budget) : 0, estimatedGuests: guests ? Number(guests) : 0 });
    router.replace('/(user)/notification-opt-in');
  };
  const next = () => { if (!valuesAreValid()) return; if (step === totalSteps - 1) complete(); else setStep((current) => current + 1); };

  return <Screen><Text style={styles.muted}>{t('stepProgress', { current: step + 1, total: totalSteps })}</Text><View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: totalSteps, now: step + 1 }} style={{ height: 8, borderRadius: 8, backgroundColor: palette.line, overflow: 'hidden' }}><View style={{ width: `${((step + 1) / totalSteps) * 100}%`, height: '100%', backgroundColor: palette.maroon }} /></View><Title>{step === 0 ? t('chooseEventType') : step === 1 ? t('eventName') : step === 2 ? t('eventDate') : step === 3 ? t('venue') : step === 4 ? `${t('totalBudget')} & ${t('estimatedGuests')}` : t('invitePartnerTitle')}</Title>{step === 0 ? <><Text style={styles.label}>{t('language')}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{languages.map((language) => <Button key={language} label={languageNames[language]} onPress={() => void setLanguage(language)} secondary />)}</View><View style={{ gap: 8 }}>{eventTypes.map(([id, key]) => <Button key={id} label={t(key)} onPress={() => setType(id)} secondary={type !== id} />)}</View></> : null}{step === 1 ? <><Text style={styles.muted}>{t('eventNameHint')}</Text><Field value={name} onChangeText={setName} placeholder={t('eventNameHint')} /></> : null}{step === 2 ? <><Text style={styles.muted}>{t('dateHint')}</Text><Field value={date} onChangeText={setDate} placeholder={t('mainEventDate')} keyboardType="numbers-and-punctuation" /><Field value={secondDate} onChangeText={setSecondDate} placeholder={t('additionalEventDate')} keyboardType="numbers-and-punctuation" /></> : null}{step === 3 ? <><Text style={styles.muted}>{t('venueHint')}</Text><PlaceSearch value={venue} onChangeText={(text) => { setVenue(text); setVenueLocation(undefined); }} onSelect={setVenueLocation} country={type === 'Indonesian wedding' ? 'ID' : 'MY'} /><Text style={styles.muted}>{t('placeTypingAllowed')}</Text></> : null}{step === 4 ? <><Text style={styles.muted}>{t('budgetHint')}</Text><Field value={budget} onChangeText={setBudget} placeholder={t('totalBudget')} keyboardType="numeric" /><Text style={styles.muted}>{t('guestHint')}</Text><Field value={guests} onChangeText={setGuests} placeholder={t('estimatedGuests')} keyboardType="numeric" /></> : null}{step === 5 ? <Card><Text style={styles.label}>{t('invitePartnerTitle')}</Text><Text style={styles.muted}>{t('invitePartnerHint')}</Text></Card> : null}<View style={{ gap: 8 }}>{step > 0 ? <Button label={t('back')} onPress={() => setStep((current) => current - 1)} secondary /> : null}<Button label={step === totalSteps - 1 ? t('finish') : t('continue')} onPress={next} />{step > 0 && step < totalSteps - 1 ? <Button label={t('skipForNow')} onPress={() => setStep((current) => current + 1)} secondary /> : null}</View></Screen>;
}
